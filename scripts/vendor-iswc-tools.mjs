// vendor-iswc-tools.mjs — descarga herramientas transversales de is-webcomponents
// (iswc) fijadas por SHA y las deja como copia vendor en este repo.
//
//   deno task vendor:iswc           # checkout local de iswc si existe; si no, SHA fijado abajo
//   deno task vendor:iswc <sha>    # otro commit de iswc (SHA completo), siempre desde jsdelivr
//   deno task vendor:iswc --remoto  # ignora el checkout local y usa el SHA fijado
//
// La copia lleva un encabezado `@vendor` con el SHA: no se edita aqui, se
// cambia en iswc (src/cdn/tools/) y se vuelve a descargar. Misma estrategia
// que ISS (tests/.audit/pull-vendor.mjs): el checkout local de iswc gana
// cuando existe, para vendorear cambios antes de que lleguen a GitHub; el
// header lleva entonces el HEAD local y `+dirty` si hay cambios sin commit.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";

const LOCAL_ISWC = process.env.ISWC_LOCAL ?? "C:/ContaPyme/Personal/apps/is-webcomponents";
const argSha = process.argv.slice(2).find((a) => /^[0-9a-f]{40}$/i.test(a));
const remoto = process.argv.includes("--remoto") || !!argSha;
const SHA = argSha ?? "eab3227d6a0666bcb2c1f053901c14effb02ca13";
const FILES = Object.fromEntries(
    ["test-cooldown.ts", "test-cooldown.schemas.ts", "test-queue.ts", "deno-test.ts", "deno-test.schemas.ts", "pin-update.mjs"]
        .map((f) => [`dist/cdn/tools/${f}`, `src/vendor/is-webcomponents/tools/${f}`]),
);

/** `{ sha, dirty }` del checkout local de iswc, o `null` si no existe o no es git. */
function localIswc(origen) {
    if (remoto || !existsSync(join(LOCAL_ISWC, origen))) return null;
    try {
        const git = (...a) => execFileSync("git", ["-C", LOCAL_ISWC, ...a], { encoding: "utf8" }).trim();
        return { sha: git("rev-parse", "HEAD"), dirty: git("status", "--porcelain", "--", origen).length > 0 };
    } catch {
        return null;
    }
}

for (const [origen, destino] of Object.entries(FILES)) {
    const local = localIswc(origen);
    let texto, etiqueta;
    if (local) {
        texto = readFileSync(join(LOCAL_ISWC, origen), "utf8");
        etiqueta = `${local.sha}${local.dirty ? "+dirty" : ""}`;
    } else {
        const url = `https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@${SHA}/${origen}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`vendor-iswc: ${res.status} al descargar ${url}`);
        texto = await res.text();
        etiqueta = SHA;
    }
    const header = `// @vendor is-webcomponents@${etiqueta} ${origen}\n// No editar: se cambia en iswc y se descarga con \`deno task vendor:iswc\`.\n`;
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, header + texto, "utf8");
    console.log(`OK ${destino} <- is-webcomponents@${etiqueta.slice(0, 16)} ${origen} (${local ? "checkout local" : "jsdelivr"})`);
}
