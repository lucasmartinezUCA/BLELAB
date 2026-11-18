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

## H. Versão 3.1 — clientes animados, desempenho e colisões
- Três clientes 3D com esqueleto: esperam sentados no sofá da recepção; quando chega a vez, levantam, andam pelo corredor (rota A*) e sentam na poltrona da sala de atendimento; olham para o aluno, acenam com a cabeça ao responder e saem pela porta de entrada quando o caso termina.
- Perfil gráfico padrão: Econômico. Agrupamento estático de malhas: 1.261 → 379 objetos desenhados. Sombras recalculadas só quando algo se move. Transmissão de vidro desligada nos modelos importados.
- Colisões: folhas de porta abertas, porta de vidro, pilar da recepção e pessoas passaram a bloquear; deslocamento guiado e caminhada dos clientes usam rota A* sobre os mesmos obstáculos (verificado: nenhuma rota cruza móveis ou paredes; o único contato é ao sentar/levantar).
- Testado: percurso completo dos 3 casos, troca de cliente, reinício, reabertura. FPS real não medido (sem GPU no ambiente de teste).

## I. Versão 3.3 — fluidez e dispositivos móveis
- Travadas ao abrir/fechar painéis e trocar de sala: as texturas desenhadas (monitor, quadro, livros, dossiês, telas) passaram a ser atualizadas só quando o conteúdo muda; shaders, texturas e mapas de rota são preparados durante o carregamento. Medido: ir para outra sala 5 ms, abrir painel 11 ms, fechar 1 ms (antes havia re-envio de ~20 texturas à GPU a cada clique).
- Movimento descontrolado: causa provável era o arraste do mouse “preso” (botão solto fora da janela) ou tecla presa ao perder o foco. Agora: arraste encerra se o botão não estiver pressionado; teclas, toque e joystick são liberados ao perder foco, trocar de aba ou abrir um painel; teclas de movimento funcionam mesmo com foco num botão.
- Celular/tablet: setas de movimento, joystick de visão e giroscópio (com calibração e permissão iOS). Testado em emulação (retrato e paisagem): giroscópio 30° → vista 30°; joystick e setas respondem e soltam corretamente. Não testado em aparelho físico.
