from pathlib import Path

replacements = {
    Path('index.html'): [
        ('<strong>Uai Perto</strong> é um nome provisório. Marca, nome fantasia e razão social da operadora ainda serão definidos.', '<strong>Uai Perto</strong> é a identidade pública oficial da Rede Comercial Inteligente em Uberaba.')
    ],
    Path('empresas.html'): [
        ('<strong>Uai Perto</strong> é nome provisório. A marca definitiva e a razão social da operadora ainda serão definidas.', '<strong>Uai Perto</strong> é a identidade pública oficial da Rede Comercial Inteligente em Uberaba.')
    ],
}

for path, items in replacements.items():
    text = path.read_text(encoding='utf-8')
    for old, new in items:
        text = text.replace(old, new)
    path.write_text(text, encoding='utf-8')
