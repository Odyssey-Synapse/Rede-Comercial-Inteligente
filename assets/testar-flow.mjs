export const SCENARIOS={
  chuveiro:{
    id:'chuveiro',
    label:'Casa',
    prompt:'Meu chuveiro queimou.',
    userText:'Meu chuveiro queimou e preciso resolver isso hoje.',
    question:'Entendi. Você já tem outro chuveiro ou ainda precisa encontrar e comprar?',
    options:[
      {id:'have',label:'Já tenho'},
      {id:'buy',label:'Preciso comprar'},
      {id:'unknown',label:'Não sei'}
    ],
    variants:{
      have:{
        answer:'Já tenho outro chuveiro.',
        response:'Ótimo. Então podemos concentrar o caminho na instalação e na verificação do local.',
        progress:['necessidade entendida','equipamento disponível','instalação necessária'],
        path:[
          ['1','Profissional compatível','Realiza a instalação e verifica as condições do local.']
        ],
        summary:'instalação e verificação no local',
        estimate:'Instalação demonstrativa: R$ 140 a R$ 190'
      },
      buy:{
        answer:'Preciso comprar.',
        response:'Certo. Então a solução pode precisar de duas capacidades: encontrar o chuveiro adequado e realizar a instalação.',
        progress:['necessidade entendida','item necessário identificado','instalação necessária'],
        path:[
          ['1','Loja participante','Fornece um chuveiro compatível com a necessidade.'],
          ['2','Profissional compatível','Realiza a instalação e verifica as condições do local.']
        ],
        summary:'chuveiro compatível + instalação',
        estimate:'Conjunto demonstrativo: R$ 260 a R$ 390'
      },
      unknown:{
        answer:'Não sei se preciso comprar.',
        response:'Sem problema. O caminho pode começar por uma avaliação e seguir para compra e instalação somente se necessário.',
        progress:['necessidade entendida','avaliação incluída','próximos passos preparados'],
        path:[
          ['1','Avaliação no local','Confirma se a troca é necessária e identifica o modelo adequado.'],
          ['2','Compra e instalação, se necessárias','Organizadas depois da avaliação demonstrativa.']
        ],
        summary:'avaliação + caminho de compra e instalação',
        estimate:'Avaliação demonstrativa: a partir de R$ 90'
      }
    }
  },
  carro:{
    id:'carro',
    label:'Veículo',
    prompt:'Meu carro não liga.',
    userText:'Meu carro não liga e eu não consigo levar até a oficina.',
    question:'Entendi. Você prefere começar com um diagnóstico no local ou avaliar assistência para levar o carro?',
    options:[
      {id:'onsite',label:'Diagnóstico no local'},
      {id:'assist',label:'Avaliar assistência'},
      {id:'unknown',label:'Não sei'}
    ],
    variants:{
      onsite:{
        answer:'Quero começar pelo diagnóstico no local.',
        response:'Certo. Vou considerar que o carro está imobilizado e que o primeiro atendimento precisa ir até você.',
        progress:['restrição de deslocamento entendida','diagnóstico no local priorizado','janela de atendimento considerada'],
        path:[
          ['1','Diagnóstico no local','Um profissional avalia bateria, partida e sinais iniciais.'],
          ['2','Próximo passo adequado','Reparo no local ou encaminhamento, conforme a avaliação.']
        ],
        summary:'diagnóstico no local + próximo passo adequado',
        estimate:'Atendimento demonstrativo: R$ 120 a R$ 220'
      },
      assist:{
        answer:'Quero avaliar assistência para levar o carro.',
        response:'Certo. O caminho pode combinar assistência no local e uma oficina capaz de receber o veículo.',
        progress:['carro imobilizado identificado','assistência necessária','destino compatível considerado'],
        path:[
          ['1','Assistência demonstrativa','Atende o local e prepara a movimentação do veículo.'],
          ['2','Oficina compatível','Recebe o carro para diagnóstico e reparo.']
        ],
        summary:'assistência + oficina compatível',
        estimate:'Valores definidos após diagnóstico demonstrativo'
      },
      unknown:{
        answer:'Ainda não sei qual caminho faz sentido.',
        response:'Tudo bem. A primeira etapa pode ser uma triagem no local para decidir sem fazer você escolher antes da hora.',
        progress:['situação entendida','triagem no local incluída','alternativas preparadas'],
        path:[
          ['1','Triagem no local','Identifica se existe solução simples onde o carro está.'],
          ['2','Alternativa, se necessária','Assistência e oficina entram somente se fizer sentido.']
        ],
        summary:'triagem + alternativa adequada ao diagnóstico',
        estimate:'Triagem demonstrativa: a partir de R$ 100'
      }
    }
  },
  compras:{
    id:'compras',
    label:'Compras',
    prompt:'Vou receber visita amanhã.',
    userText:'Vou receber visita amanhã e quero gastar até R$ 100.',
    question:'Entendi. Você precisa receber as compras ou conseguiria retirar se isso ajudar a manter o orçamento?',
    options:[
      {id:'delivery',label:'Preciso de entrega'},
      {id:'pickup',label:'Posso retirar'},
      {id:'unknown',label:'Ainda não sei'}
    ],
    variants:{
      delivery:{
        answer:'Preciso que seja entregue.',
        response:'Certo. Vou preservar o limite de R$ 100, a entrega e o prazo de amanhã ao organizar a lista.',
        progress:['orçamento entendido','lista organizada','entrega considerada'],
        path:[
          ['1','Lista compatível','Café, leite, pão de queijo e uma opção pronta para servir.'],
          ['2','Entrega demonstrativa','Janela organizada para amanhã dentro do limite total.']
        ],
        summary:'lista de compras + entrega amanhã',
        estimate:'Total demonstrativo: R$ 84,50'
      },
      pickup:{
        answer:'Posso retirar as compras.',
        response:'Ótimo. Isso permite priorizar uma lista completa dentro do orçamento e uma retirada simples.',
        progress:['orçamento entendido','produtos compatíveis reunidos','retirada considerada'],
        path:[
          ['1','Lista compatível','Itens para café e uma opção pronta dentro do orçamento.'],
          ['2','Retirada demonstrativa','Tudo reunido para uma única retirada amanhã.']
        ],
        summary:'lista de compras + retirada organizada',
        estimate:'Total demonstrativo: R$ 76,90'
      },
      unknown:{
        answer:'Ainda não sei se entrego ou retiro.',
        response:'Sem problema. Vou montar uma lista dentro do orçamento e deixar as duas opções visíveis para você decidir.',
        progress:['orçamento entendido','lista organizada','entrega e retirada comparadas'],
        path:[
          ['1','Lista compatível','Produtos essenciais e algo pronto para servir.'],
          ['2','Duas formas de receber','Retirada ou entrega demonstrativa comparadas no total.']
        ],
        summary:'lista organizada + opções de entrega e retirada',
        estimate:'Total demonstrativo: R$ 78 a R$ 92'
      }
    }
  }
};

export function beginScenario(scenarioId){
  if(!SCENARIOS[scenarioId])throw new Error('UNKNOWN_SCENARIO');
  return {scenarioId,phase:'question',answerId:null};
}

export function chooseAnswer(state,answerId){
  const scenario=SCENARIOS[state?.scenarioId];
  if(!scenario||state.phase!=='question'||!scenario.variants[answerId])throw new Error('INVALID_ANSWER');
  return {...state,answerId,phase:'progress'};
}

export function advanceState(state){
  const order=['progress','solution','details','organizing','complete'];
  const current=order.indexOf(state?.phase);
  if(current<0||current===order.length-1)return state;
  return {...state,phase:order[current+1]};
}

export function scenarioView(state){
  const scenario=SCENARIOS[state?.scenarioId];
  if(!scenario)return null;
  return {scenario,variant:state.answerId?scenario.variants[state.answerId]:null};
}
