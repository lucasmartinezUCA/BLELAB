# Relatório de qualidade — Ridgeway Legal Clinic v3

## A. Diagnóstico da versão anterior (v2)
Cena única com câmera fixa, three.js r128 global, figuras humanas e móveis feitos de esferas, cilindros e caixas, sem mapas PBR nem navegação. O conteúdo pedagógico estava correto e foi reaproveitado sem alterações (`js/cases.js`).

## B. Implementado (verificado no navegador de teste)
- Planta com 6 ambientes + corredor em escala real (18 × 12 m, pé-direito 2,9 m): recepção, sala de atendimento, biblioteca jurídica, sala de jurisdição, sala de estratégia, sala de resultados/arquivo. Paredes com espessura, rodapés, batentes, portas, janelas com caixilho/peitoril/persiana, forro com luminárias, tomadas, interruptores e placas de sala.
- Etapa → objeto físico: entrevista (pasta + poltronas + quadro de fatos), fonte do direito (3 livros no suporte), jurisdição (maquetes estadual com frontão e federal com cúpula; cartões “✓ Can hear / ✗ Cannot hear”), conselho (dossiês A–D com carimbo SIGNED), resultado (tela com matriz). Recepção: painel “Today’s clients”.
- Navegação: arrastar para olhar; WASD/setas; colisão (testada: parou a 0,26 m da estante e na parede fora da porta); deslocamento guiado porta a porta; corte com fade em “Reduce motion”; sem pointer lock.
- Acessibilidade: marcadores HTML focáveis por Tab com rótulo; botões “Go to the next step” e “Rooms”; modo só texto (também fallback sem WebGL); alto contraste; texto 100/115/130%; anúncio da sala em aria-live; descrição textual da vista no canvas; feedback com ✓/✗ e texto, não só cor; Esc fecha painéis; foco movido ao título do painel.
- Matriz legal × ética: eixos 0–100 com marcas, círculo “Y” (aluno) × losango “P” (professor), aviso quando coincidem, tabela de valores exatos.
- Perfis gráficos: Alto (sombras 4096, MSAA 4×, GTAO), Médio (sombras 2048), Econômico (sem sombras, pixel ratio 1).
- Progresso salvo no navegador (reabertura testada após recarregar a página). Gancho `LMS.report()` vazio; nada é enviado.

## C. Testes executados
| Teste | Resultado |
|---|---|
| Percurso completo dos 3 casos (modo texto) | OK: respostas, feedback, sinal/assinatura, valores exatos (60/15 vs 90/90; 95/95 = 95/95; 90/90 = 90/90), aviso de pergunta-chave não feita, registro final “6 of 6” |
| Reabertura (reload) | OK: estado `end` restaurado, intro não reaparece |
| Reinício + bloqueio de sala futura | OK: “Not yet… Take me there” |
| Percurso 3D (movimento reduzido) | OK: botão leva à sala certa e abre o painel; Esc fecha; marcador do livro B abre o painel com foco na alternativa B |
| Colisões | OK (estante, paredes) |
| Layout móvel 390 px | OK em modo texto; HUD reposicionado no 3D |
| Erros de JavaScript | Nenhum |

## D. Desempenho
O ambiente de teste não tem GPU (renderização por software SwiftShader: ~60–160 s por quadro). **Não há medição de FPS válida** e nenhum número de benchmark é informado. Recomenda-se medir em um desktop e um notebook intermediário (o lab expõe `window.__fps`). Carga total: ~11 MB (modelos 7,8 MB, texturas ~9 MB em JPEG; three.js 0,7 MB).

## E. Limitações visuais remanescentes (transparência)
- **Não atinge fotorrealismo ArchViz.** Mesa, cadeiras de escritório, estantes, monitor e objetos são procedurais com materiais PBR gerados; parecem uma visualização limpa, não fotografia.
- Sem pessoas 3D: retratos provisórios (monograma) no diálogo, conforme o prompt.
- Sem HDRI de interior real (usa RoomEnvironment); sem baking de luz global, então cantos e sombras de contato são mais suaves/planos que numa renderização offline.
- Poltronas damasco (biblioteca) têm padrão roxo do ativo original.
- Vista pela janela é um panorama ilustrado.

## F. Proposta pedagógica (para validação, não aplicada ao gabarito)
- Texto ambiental nos quadros brancos (checklist de jurisdição; “Before you sign”) foi adicionado como apoio visual, sem efeito na pontuação.

## G. Capturas (pasta `capturas/`)
hero_consult e library_hi (perfil Alto); demais no perfil Médio. As capturas hero_consult e library_hi foram feitas antes de duas correções finais (cúpula da luminária e suporte dos livros); close_books e close_desk já mostram a versão corrigida. comparacao_antes_depois.png compara a v2 com a v3.
