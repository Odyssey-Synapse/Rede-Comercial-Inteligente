import sharp from "sharp";
import { fileURLToPath } from "node:url";

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_PATH = fileURLToPath(new URL("../assets/uai-perto-logo-horizontal-hd.png", import.meta.url));
const SYMBOL_PATH = fileURLToPath(new URL("../assets/uai-perto-symbol.png", import.meta.url));

export default async function handler(req, res) {
  try {
    const [logo, symbol] = await Promise.all([
      sharp(LOGO_PATH).resize({ width: 420 }).png().toBuffer(),
      sharp(SYMBOL_PATH).resize({ width: 470 }).png().toBuffer()
    ]);

    const overlay = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .headline { font-family: Arial, Helvetica, sans-serif; font-size: 62px; font-weight: 900; letter-spacing: -1.8px; fill: #335749; }
          .support { font-family: Arial, Helvetica, sans-serif; font-size: 27px; font-weight: 700; fill: #335749; }
          .cta { font-family: Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 800; fill: #F2E8D9; }
          .arrow { font-family: Arial, Helvetica, sans-serif; font-size: 43px; font-weight: 700; fill: #D39237; }
        </style>

        <text class="headline" x="40" y="245">UBERABA ESTÁ</text>
        <text class="headline" x="40" y="322">PRESTES A FICAR</text>
        <text class="headline" x="40" y="399">MAIS PERTO</text>
        <circle cx="513" cy="386" r="10" fill="#B55A30"/>

        <text class="support" x="42" y="455">Empresas, serviços, produtos e</text>
        <text class="support" x="42" y="491">profissionais da cidade em um só lugar.</text>

        <rect x="40" y="525" width="505" height="70" rx="35" fill="#335749"/>
        <text class="cta" x="72" y="571">Veja como vai funcionar</text>
        <text class="arrow" x="479" y="574">→</text>
      </svg>
    `);

    const image = await sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 4,
        background: "#F2E8D9"
      }
    })
      .composite([
        { input: logo, left: 34, top: 22 },
        { input: symbol, left: 770, top: 135 },
        { input: overlay, left: 0, top: 0 }
      ])
      .jpeg({ quality: 94, chromaSubsampling: "4:4:4", progressive: true })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Length", String(image.length));
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=31536000, immutable");
    res.status(200).send(image);
  } catch (error) {
    console.error("OG image generation failed", error);
    res.status(500).send("OG image generation failed");
  }
}
