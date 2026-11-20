package PACOTE;

// Plugin "Musicas": lê a biblioteca de mídia do Android (a mesma que o atalho "Áudio" do seletor de arquivos e
// os outros players usam). Não copia nada e não usa internet: só lista as músicas e devolve a capa sob pedido.
// O script scripts/musicas-android.mjs copia este arquivo para o projeto Android e troca PACOTE pelo pacote do app.

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.UriPermission;
import android.provider.DocumentsContract;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import java.util.ArrayDeque;
import java.util.HashSet;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ContentResolver;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import android.content.Context;
import android.content.IntentFilter;
import android.view.WindowManager;
import androidx.core.content.ContextCompat;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Color;
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
    private BroadcastReceiver avisoSaida;
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

            };
            registradoEm = SystemClock.elapsedRealtime();
            am.registerAudioDeviceCallback(avisoFone, new Handler(Looper.getMainLooper()));
        } catch (Exception e) { avisoFone = null; /* aparelho sem esse aviso: o app segue sem a opção de tocar ao conectar */ }
        try {
            // "O som vai sair pelo alto-falante": o Android manda este aviso ANTES de trocar a saída, a tempo de pausar sem vazar som.
            avisoSaida = new BroadcastReceiver() {
                @Override
                public void onReceive(Context c, Intent i) {
                    if (i != null && AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(i.getAction())) avisarFone(false);
                }
            };
            ContextCompat.registerReceiver(getContext(), avisoSaida, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY), ContextCompat.RECEIVER_NOT_EXPORTED);
        } catch (Exception e) { avisoSaida = null; }
    }

    // Tela ligada (modo carro, tela cheia e a opção de Ajustes): não depende do navegador embutido e não pede permissão.
    @PluginMethod
    public void manterTela(PluginCall call) {
        final boolean ligado = Boolean.TRUE.equals(call.getBoolean("ligado", false));
        getActivity().runOnUiThread(() -> {
            try {
                if (ligado) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } catch (Exception e) { /* janela indisponível */ }
            call.resolve();
        });
    }

    // Fundo da janela por trás das barras do sistema (aparece em WebView antigo, onde a página não passa por trás delas)
    @PluginMethod
    public void corDaJanela(PluginCall call) {
        final String cor = call.getString("cor", "");
        if (cor == null || !cor.matches("^#[0-9A-Fa-f]{6}$")) { call.reject("cor-invalida"); return; }
        getActivity().runOnUiThread(() -> {
            try { getActivity().getWindow().getDecorView().setBackgroundColor(Color.parseColor(cor)); } catch (Exception e) { /* janela indisponível */ }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (am != null && avisoFone != null) am.unregisterAudioDeviceCallback(avisoFone);
        } catch (Exception e) { /* já solto */ }
        try { if (avisoSaida != null) getContext().unregisterReceiver(avisoSaida); } catch (Exception e) { /* já solto */ }
        avisoSaida = null;
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

    // ---------------- Backup: enviar pelo compartilhamento e cópia automática numa pasta escolhida ----------------
    // Nada disso usa a internet nem pede permissão: o envio é feito pelo app que a pessoa escolher,
    // e a pasta é liberada pelo seletor de pastas do Android, só ela.

    @PluginMethod
    public void compartilhar(PluginCall call) {
        final String nome = call.getString("nome", "orolon-backup.json");
        final String texto = call.getString("texto");
        final String titulo = call.getString("titulo", nome);
        final String tipo = call.getString("tipo", "application/json");
        if (texto == null) { call.reject("sem-texto"); return; }
        new Thread(() -> {
            try {
                File pasta = new File(getContext().getCacheDir(), "backup");
                if (!pasta.exists() && !pasta.mkdirs()) { call.reject("sem-pasta-temporaria"); return; }
                File[] velhos = pasta.listFiles();
                if (velhos != null) for (File v : velhos) v.delete();
                File f = new File(pasta, nome.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_"));
                try (FileOutputStream o = new FileOutputStream(f)) { o.write(texto.getBytes(StandardCharsets.UTF_8)); }
                Uri u = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType(tipo);
                i.putExtra(Intent.EXTRA_STREAM, u);
                i.putExtra(Intent.EXTRA_SUBJECT, nome);
                i.setClipData(ClipData.newRawUri(nome, u));
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Intent escolha = Intent.createChooser(i, titulo);
                escolha.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getActivity().startActivity(escolha);
                call.resolve();
            } catch (Exception e) {
                call.reject("falha-ao-compartilhar: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void escolherPastaBackup(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, i, "depoisDaPastaBackup");
    }

    // 1.26.8: a permissão continua sendo a da pasta escolhida (a árvore). Dentro dela o app usa a subpasta SUBPASTA, que é um documento
    // da mesma árvore: não precisa de permissão nova. O app guarda o documento da subpasta ("sub") e o manda de volta em cada conta.
    @ActivityCallback
    private void depoisDaPastaBackup(PluginCall call, ActivityResult res) {
        Intent d = res.getData();
        if (res.getResultCode() != Activity.RESULT_OK || d == null || d.getData() == null) { JSObject r = new JSObject(); r.put("cancelado", true); call.resolve(r); return; }
        final Uri arvore = d.getData();
        try {
            getContext().getContentResolver().takePersistableUriPermission(arvore, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        } catch (Exception e) { /* sem permissão permanente: a gravação vai avisar */ }
        new Thread(() -> { // olhar e criar pastas pode demorar (pastas da nuvem): fora da tela
            try {
                String id = DocumentsContract.getTreeDocumentId(arvore);
                int k = id.indexOf(':');
                String nome = k >= 0 && k < id.length() - 1 ? id.substring(k + 1) : id;
                String sub = null;
                String nomeSub = null;
                try {
                    sub = escolherSubpasta(arvore, id, nome);
                    if (sub != null) nomeSub = nomeDe(DocumentsContract.buildDocumentUriUsingTree(arvore, sub));
                } catch (Exception e) { sub = null; /* não deu para olhar ou criar: grava na própria pasta, como antes */ }
                JSObject r = new JSObject();
                r.put("uri", arvore.toString());
                if (sub != null) {
                    r.put("sub", sub);
                    r.put("nome", nome + "/" + (nomeSub != null ? nomeSub : SUBPASTA));
                } else {
                    r.put("nome", nome);
                }
                call.resolve(r);
            } catch (Exception e) {
                call.reject("falha-na-pasta: " + e.getMessage());
            }
        }).start();
    }

    // Nome exato da pasta que o app cria dentro do lugar escolhido para o backup.
    private static final String SUBPASTA = "Orolon Player";

    // Pasta recém-escolhida: devolve o documento da subpasta onde gravar, ou null para gravar na própria pasta.
    // A pasta que já se chama SUBPASTA ou que já tem cópias soltas fica como está (quem tinha backup ali continua achando);
    // nas outras, usa a subpasta que já existe (celular novo apontando para o mesmo lugar) ou cria uma.
    private String escolherSubpasta(Uri arvore, String raiz, String nomeCaminho) {
        String nomeRaiz = nomeDe(DocumentsContract.buildDocumentUriUsingTree(arvore, raiz));
        if (nomeRaiz == null) { int b = nomeCaminho.lastIndexOf('/'); nomeRaiz = b >= 0 ? nomeCaminho.substring(b + 1) : nomeCaminho; }
        if (SUBPASTA.equals(nomeRaiz)) return null;
        if (!backupsDa(arvore, raiz).isEmpty()) return null;
        String sub = subpastaEm(arvore, raiz);
        return sub != null ? sub : criarSubpasta(arvore, raiz);
    }

    // Nome de um documento, como o provedor mostra (null se ele não disser)
    private String nomeDe(Uri doc) {
        String[] campos = { DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor c = getContext().getContentResolver().query(doc, campos, null, null, null)) {
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getString(0);
        } catch (Exception e) { /* sem nome */ }
        return null;
    }

    // A subpasta SUBPASTA (nome exato, tipo pasta) dentro da pasta "pai", ou null
    private String subpastaEm(Uri arvore, String pai) {
        Uri filhos = DocumentsContract.buildChildDocumentsUriUsingTree(arvore, pai);
        String[] campos = { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME, DocumentsContract.Document.COLUMN_MIME_TYPE };
        try (Cursor c = getContext().getContentResolver().query(filhos, campos, null, null, null)) {
            if (c != null) {
                while (c.moveToNext()) {
                    if (!c.isNull(1) && SUBPASTA.equals(c.getString(1)) && DocumentsContract.Document.MIME_TYPE_DIR.equals(c.getString(2))) return c.getString(0);
                }
            }
        }
        return null;
    }

    // Cria a subpasta e devolve o documento que o provedor deu, seja qual for o nome (alguns dão "Orolon Player (1)"); null se não deu
    private String criarSubpasta(Uri arvore, String pai) {
        try {
            Uri nova = DocumentsContract.createDocument(getContext().getContentResolver(), DocumentsContract.buildDocumentUriUsingTree(arvore, pai), DocumentsContract.Document.MIME_TYPE_DIR, SUBPASTA);
            return nova == null ? null : DocumentsContract.getDocumentId(nova);
        } catch (Exception e) { return null; }
    }

    // O documento guardado ainda existe e é uma pasta? (a pessoa pode ter apagado a subpasta no gerenciador de arquivos)
    private boolean pastaExiste(Uri arvore, String doc) {
        String[] campos = { DocumentsContract.Document.COLUMN_MIME_TYPE };
        try (Cursor c = getContext().getContentResolver().query(DocumentsContract.buildDocumentUriUsingTree(arvore, doc), campos, null, null, null)) {
            return c != null && c.moveToFirst() && DocumentsContract.Document.MIME_TYPE_DIR.equals(c.getString(0));
        } catch (Exception e) { return false; }
    }

    // Pasta das cópias: a subpasta guardada quando ela existe; sem subpasta (pastas de antes desta versão), a pasta escolhida.
    // Ao gravar (recriar = true), a subpasta que sumiu é achada pelo nome ou criada de novo; se não der, a pasta escolhida.
    // Devolve { documento da pasta, documento da subpasta recriada ou null }.
    private String[] pastaDasCopias(Uri arvore, String sub, boolean recriar) {
        String raiz = DocumentsContract.getTreeDocumentId(arvore);
        if (sub == null || sub.isEmpty()) return new String[] { raiz, null };
        if (pastaExiste(arvore, sub)) return new String[] { sub, null };
        if (!recriar) return new String[] { raiz, null };
        String nova;
        try { nova = subpastaEm(arvore, raiz); } catch (Exception e) { nova = null; }
        if (nova == null) nova = criarSubpasta(arvore, raiz);
        return nova == null ? new String[] { raiz, null } : new String[] { nova, nova };
    }

    // Marca deste aparelho (4 letras/números), tirada do identificador que o Android dá ao app neste aparelho.
    // Ela não vem junto quando o Android restaura os dados num celular novo; por isso cada aparelho tem a sua (o app não apaga as cópias do outro).
    @PluginMethod
    public void aparelho(PluginCall call) {
        JSObject r = new JSObject();
        try {
            String id = Settings.Secure.getString(getContext().getContentResolver(), Settings.Secure.ANDROID_ID);
            String pacote = getContext().getPackageName();
            if (id != null && !id.isEmpty() && pacote != null && pacote.endsWith(".teste")) id = id + ":" + pacote;
            if (id != null && !id.isEmpty()) {
                final String letras = "abcdefghijkmnpqrstuvwxyz23456789";
                int h = id.hashCode();
                StringBuilder m = new StringBuilder();
                for (int i = 0; i < 4; i++) { m.append(letras.charAt(h & 31)); h >>>= 5; }
                r.put("marca", m.toString());
            }
        } catch (Exception e) { /* sem identificador: o app usa a marca sorteada de antes */ }
        call.resolve(r);
    }

    private static boolean ehBackup(String nome) { return nome != null && nome.startsWith("orolon-backup-") && nome.endsWith(".json"); }

    // Cada backup da pasta "pai" (documento da árvore) vira { id do documento, nome, modificado }
    private ArrayList<String[]> backupsDa(Uri arvore, String pai) {
        ArrayList<String[]> r = new ArrayList<>();
        Uri filhos = DocumentsContract.buildChildDocumentsUriUsingTree(arvore, pai);
        String[] campos = { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME, DocumentsContract.Document.COLUMN_LAST_MODIFIED };
        try (Cursor c = getContext().getContentResolver().query(filhos, campos, null, null, null)) {
            if (c != null) {
                while (c.moveToNext()) {
                    String nome = c.isNull(1) ? null : c.getString(1);
                    if (ehBackup(nome)) r.add(new String[] { c.getString(0), nome, c.isNull(2) ? "0" : String.valueOf(c.getLong(2)) });
                }
            }
        }
        return r;
    }

    private void apagarDocumento(Uri arvore, String id) {
        try { DocumentsContract.deleteDocument(getContext().getContentResolver(), DocumentsContract.buildDocumentUriUsingTree(arvore, id)); } catch (Exception e) { /* já apagado */ }
    }

    @PluginMethod
    public void gravarBackup(PluginCall call) {
        final String uriTxt = call.getString("uri");
        final String nome = call.getString("nome");
        final String texto = call.getString("texto");
        final int manter = Math.max(1, call.getInt("manter", 5));
        final String grupo = call.getString("grupo"); // final do nome das cópias deste aparelho: só elas entram na limpeza
        final String sub = call.getString("sub"); // documento da subpasta do app (pastas escolhidas antes da 1.26.8 não têm)
        if (uriTxt == null || texto == null || !ehBackup(nome)) { call.reject("dados-invalidos"); return; }
        new Thread(() -> {
            try {
                Uri arvore = Uri.parse(uriTxt);
                ContentResolver cr = getContext().getContentResolver();
                String[] alvo = pastaDasCopias(arvore, sub, true);
                Uri pasta = DocumentsContract.buildDocumentUriUsingTree(arvore, alvo[0]);
                Uri novo = null; // a cópia de hoje é regravada no lugar: se a gravação falhar, a anterior não some antes
                for (String[] b : backupsDa(arvore, alvo[0])) if (nome.equals(b[1])) { novo = DocumentsContract.buildDocumentUriUsingTree(arvore, b[0]); break; }
                if (novo == null) novo = DocumentsContract.createDocument(cr, pasta, "application/json", nome);
                if (novo == null) { call.reject("sem-acesso"); return; }
                try (OutputStream o = cr.openOutputStream(novo, "wt")) {
                    if (o == null) { call.reject("sem-acesso"); return; }
                    o.write(texto.getBytes(StandardCharsets.UTF_8));
                }
                ArrayList<String[]> todos = new ArrayList<>();
                for (String[] b : backupsDa(arvore, alvo[0])) if (grupo != null && b[1].endsWith(grupo)) todos.add(b); // nunca apaga cópia de outro aparelho
                Collections.sort(todos, (x, y) -> y[1].compareTo(x[1])); // o nome traz a data: o mais novo vem primeiro
                for (int n = manter; n < todos.size(); n++) apagarDocumento(arvore, todos.get(n)[0]);
                JSObject r = new JSObject();
                if (alvo[1] != null) r.put("sub", alvo[1]); // subpasta recriada: o app guarda a nova
                call.resolve(r);
            } catch (Exception e) {
                call.reject("falha-no-backup: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void listarBackups(PluginCall call) {
        final String uriTxt = call.getString("uri");
        final String sub = call.getString("sub"); // documento da subpasta do app, quando há
        if (uriTxt == null) { call.reject("sem-uri"); return; }
        new Thread(() -> {
            try {
                Uri arvore = Uri.parse(uriTxt);
                JSArray lista = new JSArray();
                for (String[] b : backupsDa(arvore, pastaDasCopias(arvore, sub, false)[0])) {
                    JSObject m = new JSObject();
                    m.put("doc", DocumentsContract.buildDocumentUriUsingTree(arvore, b[0]).toString());
                    m.put("nome", b[1]);
                    m.put("modificado", Long.parseLong(b[2]));
                    lista.put(m);
                }
                JSObject r = new JSObject();
                r.put("backups", lista);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("falha-na-pasta: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void lerBackup(PluginCall call) {
        final String doc = call.getString("doc");
        if (doc == null) { call.reject("sem-doc"); return; }
        new Thread(() -> {
            try (InputStream in = getContext().getContentResolver().openInputStream(Uri.parse(doc))) {
                if (in == null) { call.reject("sem-acesso"); return; }
                ByteArrayOutputStream o = new ByteArrayOutputStream();
                byte[] buf = new byte[16384];
                int n;
                while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
                JSObject r = new JSObject();
                r.put("texto", new String(o.toByteArray(), StandardCharsets.UTF_8));
                call.resolve(r);
            } catch (Exception e) {
                call.reject("falha-ao-ler: " + e.getMessage());
            }
        }).start();
    }

    private static String nn(String v) { return v == null ? "" : v; }
}
