import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;

export default async function handler(req, res) {
  try {
    const svg = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
        <rect width="1200" height="630" fill="#F2E8D9"/>

        <!-- Marca no topo -->
        <g transform="translate(38 30)">
          <path d="M0 0 V58 C0 89 18 109 48 116" fill="none" stroke="#335749" stroke-width="18" stroke-linecap="butt"/>
          <path d="M48 0 H72 C111 0 130 25 130 61 V119" fill="none" stroke="#D39237" stroke-width="18" stroke-linecap="butt"/>
          <circle cx="63" cy="61" r="17" fill="#B55A30"/>
          <text x="151" y="71" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="800" letter-spacing="-2" fill="#335749">Uai Perto</text>
          <text x="153" y="106" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" fill="#335749">Uberaba mais perto de você.</text>
        </g>

        <!-- Copy principal -->
        <text x="40" y="250" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="900" letter-spacing="-2.2" fill="#335749">UBERABA ESTÁ</text>
        <text x="40" y="329" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="900" letter-spacing="-2.2" fill="#335749">PRESTES A FICAR</text>
        <text x="40" y="408" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="900" letter-spacing="-2.2" fill="#335749">MAIS PERTO</text>
        <circle cx="515" cy="392" r="10" fill="#B55A30"/>

        <text x="42" y="465" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" fill="#335749">Empresas, serviços, produtos e</text>
        <text x="42" y="501" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" fill="#335749">profissionais da cidade em um só lugar.</text>

        <!-- CTA visual -->
        <rect x="40" y="530" width="510" height="72" rx="36" fill="#335749"/>
        <text x="74" y="577" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="800" fill="#F2E8D9">Veja como vai funcionar</text>
        <text x="484" y="580" font-family="Arial, Helvetica, sans-serif" font-size="43" font-weight="800" fill="#D39237">→</text>

        <!-- Símbolo ampliado da identidade visual -->
        <g>
          <path d="M805 170 V365 C805 470 862 530 958 548" fill="none" stroke="#335749" stroke-width="70" stroke-linecap="butt"/>
          <path d="M940 170 H1018 C1115 170 1172 236 1172 332 V565" fill="none" stroke="#D39237" stroke-width="70" stroke-linecap="butt"/>
          <circle cx="992" cy="366" r="74" fill="#B55A30"/>
        </g>
      </svg>
    `);

    const image = await sharp(svg, { density: 216 })
      .resize(WIDTH, HEIGHT, { fit: "fill" })
      .jpeg({ quality: 95, chromaSubsampling: "4:4:4", progressive: true, mozjpeg: true })
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
