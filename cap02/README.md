# Ridgeway Legal Clinic — Atividade 1 (Business Law and Ethics, Caps. 1 e 2)

Atividade formativa (sem nota): dois clientes (Dana Ruiz e Priya Nair), quatro salas abertas
(recepção, atendimento, biblioteca, jurisdição). Estratégia e Resultados aparecem fechadas
("Authorized staff only") e abrem nas próximas atividades.

## Estrutura
```
ridgeway-activity1/
  index.html          interface, CSS, importmap (three.js local)
  .nojekyll           obrigatório no GitHub Pages
  js/activity.js      CONFIGURAÇÃO DA ATIVIDADE: salas abertas, clientes, etapas, perguntas novas do cap. 1
  js/cases.js         conteúdo original dos casos (preservado)
  js/state.js         progressão; progresso salvo só no navegador (chave ridgeway-activity1-v1)
  js/ui.js, main.js   painéis, HUD, navegação, personagens
  js/world.js         planta, salas, portas fechadas, carregamento dos modelos
  vendor/             three.js r160 local
  assets/models/      modelos 3D (.glb)   assets/textures/  texturas
  ASSETS.md           origem e licença de cada modelo
```

## Publicar no GitHub Pages
1. Extraia o ZIP no computador.
2. Envie a PASTA `ridgeway-activity1` inteira ao repositório (não o ZIP), incluindo `.nojekyll`.
3. Endereço: `https://<usuario>.github.io/<repositorio>/ridgeway-activity1/index.html`.
4. Use esse endereço no bloco de incorporação do capítulo (altura ~760 px) e um link "Open in a new tab".

`ridgeway-activity1-standalone.html` funciona com duplo clique, sem servidor, mas passa de 25 MB:
use-o só localmente (testes, apresentações), não no GitHub.

## Para as próximas atividades
O laboratório é o mesmo; muda `js/activity.js` (salas, clientes, etapas, textos).

## Conteúdo novo para validação
Duas perguntas do cap. 1 em `js/activity.js` (`extra`): Dana (civil × criminal) e Priya (preempção federal).
