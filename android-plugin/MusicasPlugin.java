package PACOTE;

// Plugin "Musicas": lê a biblioteca de mídia do Android (a mesma que o atalho "Áudio" do seletor de arquivos e
// os outros players usam). Não copia nada e não usa internet: só lista as músicas e devolve a capa sob pedido.
// O script scripts/musicas-android.mjs copia este arquivo para o projeto Android e troca PACOTE pelo pacote do app.

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.UriPermission;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import java.util.ArrayDeque;
import java.util.HashSet;
import android.content.ContentResolver;
import android.content.Context;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Size;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;

@CapacitorPlugin(
    name = "Musicas",
    permissions = {
        @Permission(alias = "audio", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
        @Permission(alias = "armazenamento", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class MusicasPlugin extends Plugin {

    // ---------------- Fone (com fio, Bluetooth, USB) e toque na notificação de mídia ----------------
    // Não pede permissão nova: o Android avisa quando um aparelho de som entra ou sai, enquanto o app está aberto ou em segundo plano.

    private AudioDeviceCallback avisoFone;
    private long registradoEm = 0;

    private static boolean ehFone(AudioDeviceInfo d) {
        if (d == null || !d.isSink()) return false;
        int t = d.getType();
        return t == AudioDeviceInfo.TYPE_WIRED_HEADSET || t == AudioDeviceInfo.TYPE_WIRED_HEADPHONES
            || t == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP || t == AudioDeviceInfo.TYPE_USB_HEADSET
            || t == 26; // 26 = fone Bluetooth de baixa energia (Android 12+)
    }

    private static boolean temFone(AudioDeviceInfo[] ds) {
        if (ds == null) return false;
        for (AudioDeviceInfo d : ds) if (ehFone(d)) return true;
        return false;
    }

    private void avisarFone(boolean ligado) {
        JSObject r = new JSObject();
        r.put("ligado", ligado);
        notifyListeners("fone", r);
    }

    @Override
    public void load() {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (am == null) return;
            avisoFone = new AudioDeviceCallback() {
                @Override
                public void onAudioDevicesAdded(AudioDeviceInfo[] ds) {
                    // logo ao registrar, o Android manda a lista do que já estava ligado: isso não é "conectar o fone"
                    if (SystemClock.elapsedRealtime() - registradoEm < 2000) return;
                    if (temFone(ds)) avisarFone(true);
                }

                @Override
                public void onAudioDevicesRemoved(AudioDeviceInfo[] ds) {
                    if (temFone(ds)) avisarFone(false);
                }
            };
            registradoEm = SystemClock.elapsedRealtime();
            am.registerAudioDeviceCallback(avisoFone, new Handler(Looper.getMainLooper()));
        } catch (Exception e) { avisoFone = null; /* aparelho sem esse aviso: o app segue sem as opções do fone */ }
    }

    @Override
    protected void handleOnDestroy() {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (am != null && avisoFone != null) am.unregisterAudioDeviceCallback(avisoFone);
        } catch (Exception e) { /* já solto */ }
        avisoFone = null;
        super.handleOnDestroy();
    }

    // A notificação de mídia reabre o app com uma intenção sem ação; o ícone do app usa a ação MAIN.
    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent != null && intent.getAction() == null) notifyListeners("notificacao", new JSObject());
    }

    private String alias() { return Build.VERSION.SDK_INT >= 33 ? "audio" : "armazenamento"; }

    private void responderEstado(PluginCall call) {
        PermissionState s = getPermissionState(alias());
        JSObject r = new JSObject();
        r.put("estado", s == PermissionState.GRANTED ? "granted" : s == PermissionState.DENIED ? "denied" : "prompt");
        call.resolve(r);
    }

    @PluginMethod
    public void permissao(PluginCall call) { responderEstado(call); }

    @PluginMethod
    public void pedir(PluginCall call) {
        if (getPermissionState(alias()) == PermissionState.GRANTED) { responderEstado(call); return; }
        requestPermissionForAlias(alias(), call, "depoisDePedir");
    }

    @PermissionCallback
    private void depoisDePedir(PluginCall call) { responderEstado(call); }

    private static String texto(Cursor c, int i) { return i < 0 || c.isNull(i) ? "" : c.getString(i); }
    private static long numero(Cursor c, int i) { return i < 0 || c.isNull(i) ? 0 : c.getLong(i); }

    @PluginMethod
    public void listar(PluginCall call) {
        if (getPermissionState(alias()) != PermissionState.GRANTED) { call.reject("sem-permissao"); return; }
        new Thread(() -> {
            try {
                Uri colecao = Build.VERSION.SDK_INT >= 29
                    ? MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
                    : MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                String caminho = Build.VERSION.SDK_INT >= 29 ? MediaStore.Audio.Media.RELATIVE_PATH : MediaStore.Audio.Media.DATA;
                String[] campos = {
                    MediaStore.Audio.Media._ID, MediaStore.Audio.Media.TITLE, MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.ALBUM, MediaStore.Audio.Media.ALBUM_ID, MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.TRACK, MediaStore.Audio.Media.DISPLAY_NAME, MediaStore.Audio.Media.SIZE,
                    MediaStore.Audio.Media.DATE_MODIFIED, MediaStore.Audio.Media.MIME_TYPE, caminho
                };
                JSArray lista = new JSArray();
                ContentResolver cr = getContext().getContentResolver();
                try (Cursor c = cr.query(colecao, campos, MediaStore.Audio.Media.IS_MUSIC + " != 0", null, null)) {
                    if (c != null) {
                        int iId = c.getColumnIndex(campos[0]), iTit = c.getColumnIndex(campos[1]), iArt = c.getColumnIndex(campos[2]),
                            iAlb = c.getColumnIndex(campos[3]), iAlbId = c.getColumnIndex(campos[4]), iDur = c.getColumnIndex(campos[5]),
                            iFx = c.getColumnIndex(campos[6]), iNome = c.getColumnIndex(campos[7]), iTam = c.getColumnIndex(campos[8]),
                            iMod = c.getColumnIndex(campos[9]), iMime = c.getColumnIndex(campos[10]), iCam = c.getColumnIndex(campos[11]);
                        while (c.moveToNext()) {
                            long id = c.getLong(iId);
                            String pasta = texto(c, iCam);
                            if (Build.VERSION.SDK_INT < 29) { int k = pasta.lastIndexOf('/'); pasta = k > 0 ? pasta.substring(0, k) : ""; }
                            JSObject m = new JSObject();
                            m.put("id", id);
                            m.put("uri", ContentUris.withAppendedId(colecao, id).toString());
                            m.put("titulo", texto(c, iTit));
                            m.put("artista", texto(c, iArt));
                            m.put("album", texto(c, iAlb));
                            m.put("albumId", numero(c, iAlbId));
                            m.put("duracao", numero(c, iDur));
                            m.put("faixa", numero(c, iFx));
                            m.put("nome", texto(c, iNome));
                            m.put("tamanho", numero(c, iTam));
                            m.put("modificado", numero(c, iMod));
                            m.put("mime", texto(c, iMime));
                            m.put("pasta", pasta);
                            lista.put(m);
                        }
                    }
                }
                JSObject r = new JSObject();
                r.put("musicas", lista);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("falha-ao-listar: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void capa(PluginCall call) {
        String uri = call.getString("uri");
        int tam = call.getInt("tamanho", 512);
        if (uri == null) { call.reject("sem-uri"); return; }
        new Thread(() -> {
            JSObject r = new JSObject();
            try {
                Bitmap bmp = null;
                Uri u = Uri.parse(uri);
                // 1º a arte gravada no próprio arquivo (cada música com a sua, como os MP3 baixados do YouTube)
                MediaMetadataRetriever mmr = new MediaMetadataRetriever();
                try {
                    mmr.setDataSource(getContext(), u);
                    byte[] art = mmr.getEmbeddedPicture();
                    if (art != null) bmp = BitmapFactory.decodeByteArray(art, 0, art.length);
                } catch (Exception e) { bmp = null; }
                finally { try { mmr.release(); } catch (Exception e) { /* ignora */ } }
                // 2º a miniatura do Android (capa do álbum ou imagem da pasta)
                if (bmp == null && Build.VERSION.SDK_INT >= 29) {
                    try { bmp = getContext().getContentResolver().loadThumbnail(u, new Size(tam, tam), null); } catch (Exception e) { bmp = null; }
                }
                if (bmp != null) {
                    if (bmp.getWidth() > tam || bmp.getHeight() > tam) {
                        float f = (float) tam / Math.max(bmp.getWidth(), bmp.getHeight());
                        bmp = Bitmap.createScaledBitmap(bmp, Math.max(1, Math.round(bmp.getWidth() * f)), Math.max(1, Math.round(bmp.getHeight() * f)), true);
                    }
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    bmp.compress(Bitmap.CompressFormat.JPEG, 86, out);
                    r.put("base64", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
                } else r.put("base64", null);
            } catch (Exception e) {
                r.put("base64", null);
            }
            call.resolve(r);
        }).start();
    }

    // ---------------- Pasta escolhida pela pessoa (seletor de pastas do Android) ----------------
    // O Android decide quais pastas podem ser escolhidas (algumas de outros apps são bloqueadas por segurança).

    @PluginMethod
    public void escolherPasta(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, i, "depoisDaPasta");
    }

    @ActivityCallback
    private void depoisDaPasta(PluginCall call, ActivityResult res) {
        JSObject r = new JSObject();
        Intent d = res.getData();
        if (res.getResultCode() != Activity.RESULT_OK || d == null || d.getData() == null) { r.put("cancelado", true); call.resolve(r); return; }
        Uri arvore = d.getData();
        try { getContext().getContentResolver().takePersistableUriPermission(arvore, Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (Exception e) { /* sem permissão permanente */ }
        String id = DocumentsContract.getTreeDocumentId(arvore);
        int k = id.indexOf(':');
        r.put("uri", arvore.toString());
        r.put("nome", k >= 0 ? id.substring(k + 1) : id);
        call.resolve(r);
    }

    @PluginMethod
    public void soltarPasta(PluginCall call) {
        String uri = call.getString("uri");
        try { getContext().getContentResolver().releasePersistableUriPermission(Uri.parse(uri), Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (Exception e) { /* já solta */ }
        call.resolve();
    }

    private boolean temAcesso(Uri arvore) {
        for (UriPermission p : getContext().getContentResolver().getPersistedUriPermissions())
            if (p.isReadPermission() && p.getUri().equals(arvore)) return true;
        return false;
    }

    private static final java.util.regex.Pattern EXT = java.util.regex.Pattern.compile("(?i).*\\.(mp3|flac|m4a|aac|ogg|oga|opus|wav|aif|aiff)$");

    @PluginMethod
    public void listarPasta(PluginCall call) {
        String uriTxt = call.getString("uri");
        if (uriTxt == null) { call.reject("sem-uri"); return; }
        HashSet<String> conhecidos = new HashSet<>();
        try { JSArray c = call.getArray("conhecidos"); if (c != null) for (int n = 0; n < c.length(); n++) conhecidos.add(c.getString(n)); } catch (Exception e) { /* lista vazia */ }
        new Thread(() -> {
            try {
                Uri arvore = Uri.parse(uriTxt);
                if (!temAcesso(arvore)) { call.reject("sem-acesso"); return; }
                ContentResolver cr = getContext().getContentResolver();
                String[] campos = { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                    DocumentsContract.Document.COLUMN_MIME_TYPE, DocumentsContract.Document.COLUMN_SIZE, DocumentsContract.Document.COLUMN_LAST_MODIFIED };
                ArrayDeque<String[]> pilha = new ArrayDeque<>();
                pilha.push(new String[] { DocumentsContract.getTreeDocumentId(arvore), "" , "0" });
                JSArray lista = new JSArray();
                int total = 0;
                while (!pilha.isEmpty() && total < 6000) {
                    String[] atual = pilha.pop();
                    Uri filhos = DocumentsContract.buildChildDocumentsUriUsingTree(arvore, atual[0]);
                    try (Cursor c = cr.query(filhos, campos, null, null, null)) {
                        if (c == null) continue;
                        while (c.moveToNext()) {
                            String id = c.getString(0), nome = c.getString(1), mime = c.isNull(2) ? "" : c.getString(2);
                            if (DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) {
                                int prof = Integer.parseInt(atual[2]);
                                if (prof < 12 && nome != null && !nome.startsWith(".")) pilha.push(new String[] { id, atual[1] + nome + "/", String.valueOf(prof + 1) });
                                continue;
                            }
                            if (nome == null || !(mime.startsWith("audio/") || EXT.matcher(nome).matches())) continue;
                            total++;
                            Uri doc = DocumentsContract.buildDocumentUriUsingTree(arvore, id);
                            JSObject m = new JSObject();
                            m.put("doc", doc.toString());
                            String tocar = doc.toString(); long mediaId = 0;
                            if (Build.VERSION.SDK_INT >= 29) { // o endereço da biblioteca de mídia toca com mais segurança que o do documento
                                try { Uri mu = MediaStore.getMediaUri(getContext(), doc); if (mu != null) { tocar = mu.toString(); mediaId = ContentUris.parseId(mu); } } catch (Exception e) { /* fora da biblioteca de mídia */ }
                            }
                            m.put("uri", tocar);
                            m.put("mediaId", mediaId);
                            m.put("nome", nome);
                            m.put("mime", mime);
                            m.put("tamanho", c.isNull(3) ? 0 : c.getLong(3));
                            m.put("modificado", c.isNull(4) ? 0 : c.getLong(4) / 1000);
                            m.put("pasta", atual[1]);
                            if (!conhecidos.contains(doc.toString())) { // só lê as etiquetas dos arquivos novos
                                MediaMetadataRetriever mmr = new MediaMetadataRetriever();
                                try {
                                    mmr.setDataSource(getContext(), doc);
                                    m.put("titulo", nn(mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)));
                                    m.put("artista", nn(mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)));
                                    m.put("album", nn(mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)));
                                    String dur = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                                    m.put("duracao", dur == null ? 0 : Long.parseLong(dur));
                                    String fx = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER);
                                    try { m.put("faixa", fx == null ? 0 : Integer.parseInt(fx.split("/")[0].trim())); } catch (Exception e) { m.put("faixa", 0); }
                                } catch (Exception e) { /* arquivo sem etiquetas legíveis */ }
                                finally { try { mmr.release(); } catch (Exception e) { /* ignora */ } }
                            }
                            lista.put(m);
                        }
                    }
                }
                JSObject r = new JSObject();
                r.put("musicas", lista);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("falha-na-pasta: " + e.getMessage());
            }
        }).start();
    }

    private static String nn(String v) { return v == null ? "" : v; }
}
