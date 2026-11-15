package PACOTE;

// Plugin "Musicas": lê a biblioteca de mídia do Android (a mesma que o atalho "Áudio" do seletor de arquivos e
// os outros players usam). Não copia nada e não usa internet: só lista as músicas e devolve a capa sob pedido.
// O script scripts/musicas-android.mjs copia este arquivo para o projeto Android e troca PACOTE pelo pacote do app.

import android.Manifest;
import android.content.ContentResolver;
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
                if (Build.VERSION.SDK_INT >= 29) {
                    try { bmp = getContext().getContentResolver().loadThumbnail(u, new Size(tam, tam), null); } catch (Exception e) { bmp = null; }
                }
                if (bmp == null) {
                    MediaMetadataRetriever mmr = new MediaMetadataRetriever();
                    try {
                        mmr.setDataSource(getContext(), u);
                        byte[] art = mmr.getEmbeddedPicture();
                        if (art != null) bmp = BitmapFactory.decodeByteArray(art, 0, art.length);
                    } catch (Exception e) { bmp = null; }
                    finally { try { mmr.release(); } catch (Exception e) { /* ignora */ } }
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
}
