/* Orolon: leitura de tags dos arquivos de áudio, sem nenhuma biblioteca externa.
   Formatos: MP3 (ID3v2.2/2.3/2.4), FLAC, M4A/MP4 (iTunes), OGG Vorbis e Opus.
   lerTags(arquivo) devolve {t: título, a: artista, al: álbum, n: faixa, capa: Blob}. */
"use strict";
(function () {
  const dec = (b, enc) => { try { return new TextDecoder(enc).decode(b); } catch (e) { return ""; } };
  const ss = (b, o) => (b[o] & 127) << 21 | (b[o + 1] & 127) << 14 | (b[o + 2] & 127) << 7 | (b[o + 3] & 127);
  const be = (b, o, n = 4) => { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + b[o + i]; return v; };
  const le = (b, o) => b[o] | b[o + 1] << 8 | b[o + 2] << 16 | (b[o + 3] << 24 >>> 0);
  const ler = async (f, a, z) => new Uint8Array(await f.slice(a, z).arrayBuffer());
  const mimeOk = (m) => (m && m.includes("/") ? m : "image/jpeg");
  const num = (s) => parseInt(String(s)) || 0;

  /* ---- MP3: ID3v2 ---- */
  function txt(b) {
    const e = b[0], d = b.subarray(1);
    const s = e === 0 ? dec(d, "latin1") : e === 3 ? dec(d, "utf-8") : e === 2 ? dec(d, "utf-16be")
      : d[0] === 0xFE && d[1] === 0xFF ? dec(d.subarray(2), "utf-16be")
      : dec(d[0] === 0xFF && d[1] === 0xFE ? d.subarray(2) : d, "utf-16le");
    return s.split("\0")[0].trim();
  }
  async function lerID3(f) {
    const h = await ler(f, 0, 10);
    if (h[0] !== 73 || h[1] !== 68 || h[2] !== 51) return null;
    const ver = h[3], size = ss(h, 6);
    let b = await ler(f, 10, 10 + size);
    if (h[5] & 0x80 && ver < 4) { // dessincronização
      const o = new Uint8Array(b.length); let j = 0;
      for (let i = 0; i < b.length; i++) { o[j++] = b[i]; if (b[i] === 0xFF && b[i + 1] === 0) i++; }
      b = o.subarray(0, j);
    }
    let p = 0;
    if (h[5] & 0x40 && ver > 2) p = ver === 4 ? ss(b, 0) : be(b, 0) + 4;
    const m = {}, hd = ver === 2 ? 6 : 10;
    while (p + hd <= b.length) {
      const id = dec(b.subarray(p, p + (ver === 2 ? 3 : 4)), "latin1");
      const sz = ver === 2 ? be(b, p + 3, 3) : ver === 4 ? ss(b, p + 4) : be(b, p + 4);
      if (!sz || !/^[A-Z0-9]+$/.test(id)) break;
      const d = b.subarray(p + hd, p + hd + sz); p += hd + sz;
      if (id === "TIT2" || id === "TT2") m.t = txt(d);
      else if (id === "TPE1" || id === "TP1") m.a = txt(d);
      else if ((id === "TPE2" || id === "TP2") && !m.a) m.a = txt(d);
      else if (id === "TALB" || id === "TAL") m.al = txt(d);
      else if (id === "TRCK" || id === "TRK") m.n = num(txt(d));
      else if ((id === "TXXX" || id === "TXX") && !m.letra) {
        const e = d[0], dupla = e === 1 || e === 2; let q = 1;
        if (dupla) { while (q + 1 < d.length && (d[q] || d[q + 1])) q += 2; q += 2; } else { while (q < d.length && d[q]) q++; q++; }
        const desc = txt(d.subarray(0, q)).toUpperCase();
        if (/LYRIC|^USLT$|LETRA/.test(desc)) { const v = new Uint8Array(d.length - q + 1); v[0] = e; v.set(d.subarray(q), 1); m.letra = txt(v); }
      }
      else if ((id === "SYLT" || id === "SLT") && !m.sinc && d.length > 7) {
        // codificação, idioma (3), formato do tempo (2 = milissegundos), tipo, descrição, depois [texto, tempo de 4 bytes]...
        const e = d[0], dupla = e === 1 || e === 2, fmtT = d[4];
        if (fmtT === 2) {
          let q = 6; const fim0 = () => { if (dupla) { while (q + 1 < d.length && (d[q] || d[q + 1])) q += 2; q += 2; } else { while (q < d.length && d[q]) q++; q++; } };
          fim0(); // pula a descrição
          const linhas = [];
          while (q < d.length - 4) {
            const ini = q; fim0(); const bytes = d.subarray(ini, Math.max(ini, q - (dupla ? 2 : 1)));
            const u = new Uint8Array(bytes.length + 1); u[0] = e; u.set(bytes, 1);
            const ms = be(d, q); q += 4;
            const tx = txt(u).replace(/^[\r\n]+/, ""), mm = Math.floor(ms / 60000), ss = ((ms % 60000) / 1000).toFixed(2).padStart(5, "0");
            linhas.push(`[${String(mm).padStart(2, "0")}:${ss}]${tx}`);
          }
          if (linhas.length) m.sinc = linhas.join("\n");
        }
      }
      else if ((id === "USLT" || id === "ULT") && !m.letra && d.length > 4) {
        // codificação (1 byte), idioma (3 bytes), descrição terminada em zero, letra
        const e = d[0], dupla = e === 1 || e === 2; let q = 4;
        if (dupla) { while (q + 1 < d.length && (d[q] || d[q + 1])) q += 2; q += 2; } else { while (q < d.length && d[q]) q++; q++; }
        const corpo = d.subarray(q), u = new Uint8Array(corpo.length + 1); u[0] = e; u.set(corpo, 1);
        const t = e === 1 || e === 2 ? dec(corpo[0] === 0xFE && corpo[1] === 0xFF ? corpo.subarray(2) : corpo[0] === 0xFF && corpo[1] === 0xFE ? corpo.subarray(2) : corpo, e === 2 || (corpo[0] === 0xFE && corpo[1] === 0xFF) ? "utf-16be" : "utf-16le")
          : dec(corpo, e === 3 ? "utf-8" : "latin1");
        m.letra = t.replace(/\0+$/, "").trim();
      }
      else if ((id === "APIC" || id === "PIC") && !m.capa) {
        const e = d[0]; let q, mime;
        if (ver === 2) { mime = "image/" + dec(d.subarray(1, 4), "latin1").toLowerCase().replace("jpg", "jpeg"); q = 4; }
        else { const z = d.indexOf(0, 1); mime = dec(d.subarray(1, z), "latin1"); q = z + 1; }
        q++; // tipo da imagem
        if (e === 1 || e === 2) { while (q + 1 < d.length && (d[q] || d[q + 1])) q += 2; q += 2; }
        else { while (q < d.length && d[q]) q++; q++; }
        if (q < d.length) m.capa = new Blob([d.slice(q)], { type: mimeOk(mime) });
      }
    }
    return m;
  }

  /* ---- Comentários Vorbis (FLAC, OGG, Opus) ---- */
  function imagemFLAC(d) {
    let q = 4; const ml = be(d, q); q += 4;
    const mime = dec(d.subarray(q, q + ml), "latin1"); q += ml;
    const dl = be(d, q); q += 4 + dl + 16;
    const pl = be(d, q); q += 4;
    if (q + pl > d.length || !pl) return null;
    return new Blob([d.slice(q, q + pl)], { type: mimeOk(mime) });
  }
  function vorbis(d, q, m) {
    if (q + 4 > d.length) return;
    q += 4 + le(d, q);
    if (q + 4 > d.length) return;
    const c = le(d, q); q += 4;
    for (let i = 0; i < c && q + 4 <= d.length; i++) {
      const l = le(d, q); q += 4;
      if (q + l > d.length) break;
      const s = dec(d.subarray(q, q + l), "utf-8"); q += l;
      const k = s.indexOf("="), key = s.slice(0, k).toUpperCase(), v = s.slice(k + 1).trim();
      if (key === "TITLE") m.t = v;
      else if (key === "ARTIST") m.a = v;
      else if (key === "ALBUMARTIST" && !m.a) m.a = v;
      else if (key === "ALBUM") m.al = v;
      else if (key === "TRACKNUMBER") m.n = num(v);
      else if (/LYRIC|^LETRA/.test(key) && v) { if (/\[\d{1,3}:\d{2}/.test(v)) { if (!m.sinc) m.sinc = v; } else if (!m.letra) m.letra = v; }
      else if (key === "METADATA_BLOCK_PICTURE" && !m.capa) {
        try {
          const bin = atob(v), u = new Uint8Array(bin.length);
          for (let j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j);
          m.capa = imagemFLAC(u);
        } catch (e) { /* capa inválida: ignora */ }
      }
    }
  }
  async function lerFLAC(f, ini = 0) {
    if (dec(await ler(f, ini, ini + 4), "latin1") !== "fLaC") return null;
    let p = ini + 4; const m = {};
    for (let n = 0; n < 64; n++) {
      const bh = await ler(f, p, p + 4); if (bh.length < 4) break;
      const tipo = bh[0] & 127, len = be(bh, 1, 3);
      if (tipo === 4) vorbis(await ler(f, p + 4, p + 4 + len), 0, m);
      else if (tipo === 6 && !m.capa) m.capa = imagemFLAC(await ler(f, p + 4, p + 4 + len));
      p += 4 + len;
      if (bh[0] & 128) break;
    }
    return m;
  }
  async function lerOGG(f) {
    const b = await ler(f, 0, 1048576);
    if (dec(b.subarray(0, 4), "latin1") !== "OggS") return null;
    // junta o conteúdo das páginas, sem os cabeçalhos, para ler os pacotes em sequência
    const partes = []; let p = 0, total = 0;
    while (p + 27 <= b.length && b[p] === 79 && b[p + 1] === 103 && b[p + 2] === 103 && b[p + 3] === 83) {
      const ns = b[p + 26]; if (p + 27 + ns > b.length) break;
      let len = 0; for (let i = 0; i < ns; i++) len += b[p + 27 + i];
      const ini = p + 27 + ns, fim = Math.min(ini + len, b.length);
      partes.push(b.subarray(ini, fim)); total += fim - ini; p = ini + len;
    }
    const d = new Uint8Array(total); let o = 0;
    for (const x of partes) { d.set(x, o); o += x.length; }
    const m = {}, s = dec(d.subarray(0, Math.min(d.length, 4096)), "latin1");
    let i = s.indexOf("OpusTags");
    if (i >= 0) vorbis(d, i + 8, m);
    else if ((i = s.indexOf("\x03vorbis")) >= 0) vorbis(d, i + 7, m);
    return m;
  }

  /* ---- M4A/MP4 (átomos do iTunes) ---- */
  function filhos(b, s, e, cb) {
    let q = s;
    while (q + 8 <= e) {
      let sz = be(b, q), hl = 8;
      const tp = dec(b.subarray(q + 4, q + 8), "latin1");
      if (sz === 1) { sz = be(b, q + 8, 8); hl = 16; } else if (sz === 0) sz = e - q;
      if (sz < hl || q + sz > e) break;
      if (cb(tp, q + hl, q + sz) === false) break;
      q += sz;
    }
  }
  async function lerMP4(f) {
    if (dec(await ler(f, 4, 8), "latin1") !== "ftyp") return null;
    let p = 0, moov = null;
    while (p + 8 <= f.size) {
      const hd = await ler(f, p, p + 16);
      let sz = be(hd, 0), hl = 8;
      const tp = dec(hd.subarray(4, 8), "latin1");
      if (sz === 1) { sz = be(hd, 8, 8); hl = 16; } else if (sz === 0) sz = f.size - p;
      if (sz < 8) break;
      if (tp === "moov") { if (sz < 128e6) moov = await ler(f, p + hl, p + sz); break; }
      p += sz;
    }
    const m = {};
    if (!moov) return m;
    const achar = (s, e, nome, cb) => filhos(moov, s, e, (tp, a, z) => { if (tp === nome) { cb(a, z); return false; } });
    achar(0, moov.length, "udta", (a, z) => achar(a, z, "meta", (a2, z2) => {
      // 'meta' costuma ter 4 bytes de versão antes dos filhos
      const ini = dec(moov.subarray(a2 + 4, a2 + 8), "latin1") === "hdlr" ? a2 : a2 + 4;
      achar(ini, z2, "ilst", (a3, z3) => filhos(moov, a3, z3, (item, ia, iz) => {
        filhos(moov, ia, iz, (tp, da, dz) => {
          if (tp !== "data" || dz - da < 8) return;
          const tipo = be(moov, da), v = moov.subarray(da + 8, dz);
          if (item === "\xA9nam") m.t = dec(v, "utf-8").trim();
          else if (item === "\xA9ART") m.a = dec(v, "utf-8").trim();
          else if (item === "aART" && !m.a) m.a = dec(v, "utf-8").trim();
          else if (item === "\xA9alb") m.al = dec(v, "utf-8").trim();
          else if (item === "trkn" && v.length >= 4) m.n = be(v, 2, 2);
          else if (item === "\xA9lyr" && !m.letra) m.letra = dec(v, "utf-8").trim();
          else if (item === "covr" && !m.capa) m.capa = new Blob([v.slice()], { type: tipo === 14 ? "image/png" : "image/jpeg" });
          return false;
        });
      }));
    }));
    return m;
  }

  async function bruto(f) {
    // FLAC com etiqueta ID3 no começo: lê as duas e junta (a do FLAC tem prioridade)
    const h = await ler(f, 0, 10);
    if (h[0] === 73 && h[1] === 68 && h[2] === 51) {
      const id3 = (await lerID3(f)) || {}, fim = 10 + ss(h, 6) + (h[5] & 0x10 ? 10 : 0);
      let flac = null; try { flac = await lerFLAC(f, fim); } catch (e) { /* não é FLAC */ }
      if (flac) { for (const k in id3) if (flac[k] === undefined || flac[k] === "") flac[k] = id3[k]; return flac; }
      return id3;
    }
    for (const leitor of [lerFLAC, lerMP4, lerOGG]) {
      try { const m = await leitor(f); if (m) return m; } catch (e) { /* tenta o próximo */ }
    }
    return {};
  }
  async function lerTags(f) {
    let m = {};
    try { m = await bruto(f); } catch (e) { m = {}; }
    if (m.sinc) m.letra = m.sinc; // letra sincronizada vale mais que a solta
    delete m.sinc;
    if (m.letra) m.letra = String(m.letra).replace(/\r\n?/g, "\n").trim();
    return m;
  }
  (typeof window !== "undefined" ? window : globalThis).lerTags = lerTags;
})();
