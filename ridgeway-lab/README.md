# Ridgeway Legal Clinic — Escritório jurídico virtual (Business Law and Ethics, Cap. 2)

## Estrutura
```
ridgeway-lab/
  index.html            interface, CSS, importmap (three.js local)
  js/cases.js           conteúdo dos 3 casos — preservado sem alterações
  js/state.js           progressão (entrevista → lei → tribunal → conselho → resultado), progresso local
  js/materials.js       biblioteca de materiais PBR
  js/builders.js        móveis e objetos (escala 1 unidade = 1 m)
  js/world.js           planta, salas, estações, hotspots, carregamento GLB
  js/nav.js             navegação em primeira pessoa, colisões, deslocamento guiado
  js/ui.js              painéis, matriz legal × ética, roteiro, atualização dos objetos 3D
  js/main.js            renderizador, perfis gráficos, iluminação, marcadores acessíveis
  vendor/               three.js r160 + addons oficiais (MIT)
  assets/models/        5 modelos GLB (CC BY 4.0) — ver ASSETS.md
  assets/textures/      texturas PBR geradas (gen_textures.py)
  ASSETS.md             manifesto de ativos e licenças
```

## Abrir rapidamente (duplo clique)
Abra `ridgeway-lab-standalone.html`: arquivo único (~20 MB) com código, modelos e texturas embutidos. Funciona direto do disco, sem servidor.

## Executar a versão em pasta localmente
Módulos ES não funcionam via `file://`. Na pasta `ridgeway-lab`:
```
python3 -m http.server 8000
```
Abra http://localhost:8000/index.html. Nenhuma dependência externa obrigatória (as fontes do Google são opcionais; sem elas, usa fontes do sistema).

## Publicar no GitHub Pages (passo a passo)
1. Suba a pasta **ridgeway-lab inteira**, mantendo a estrutura: `index.html`, `.nojekyll`, `js/` (10 arquivos), `vendor/` (com `addons/`), `assets/models/` (9 arquivos .glb) e `assets/textures/` (19 .jpg).
   - Pelo site do GitHub: arraste a pasta inteira para “Add file › Upload files”. Limite do site: 25 MB por arquivo (o maior arquivo da pasta tem 2,4 MB; o `ridgeway-lab-standalone.html` tem ~23 MB e também passa).
   - O arquivo `.nojekyll` é oculto no Windows/macOS; se não aparecer para arrastar, crie no GitHub um arquivo novo com esse nome, vazio.
2. Em Settings › Pages, publique a branch. Aguarde 1–2 minutos.
3. Abra `https://<usuario>.github.io/<repo>/ridgeway-lab/index.html`. Na primeira visita o carregamento leva alguns segundos (cerca de 18 MB); a tela mostra “Still loading…” enquanto baixa.
4. Se aparecer “The 3D office could not start”, a mensagem agora lista o arquivo que faltou.

1. Envie a pasta `ridgeway-lab/` inteira para o repositório do GitHub Pages (ex.: `lucasmartinezUCA/<repo>/ridgeway-lab/`).
2. No Studio, incorpore pelo campo de URL: `https://<usuario>.github.io/<repo>/ridgeway-lab/index.html` (altura recomendada 760 px; o layout se adapta).
3. O `aula2.html` entregue aponta para `ridgeway-lab/index.html` relativo — funciona quando a pasta está ao lado do arquivo. Para o Studio, troque o `src` do iframe pela URL do GitHub Pages.

## Controles
- Andar: W A S D ou setas. Olhar: arrastar. Celular: setas na tela + arrastar.
- Clique em objetos/marcadores (pasta, quadro de fatos, livros, maquetes, dossiês, telas).
- “Go to the next step” leva à sala certa pelo corredor. “Rooms” lista as salas.
- Settings: reduzir movimento, alto contraste, tamanho de texto, perfil gráfico, modo só texto.

## Integração futura com AVA
`js/state.js` expõe `LMS.report()` (vazio). O progresso fica só no navegador (localStorage). Nada é enviado a nenhum servidor.
