#!/usr/bin/env bash
# Bateria de testes manuais contra a API rodando em localhost:3333.
API=http://localhost:3333
ok=0; falhou=0

# checa(descricao, status_esperado, status_recebido, corpo)
checa() {
  if [ "$2" = "$3" ]; then
    echo "  OK   [$3] $1"
    ok=$((ok+1))
  else
    echo "  FALHA (esperado $2, veio $3) $1"
    echo "        corpo: $(echo "$4" | head -c 300)"
    falhou=$((falhou+1))
  fi
}

# req(metodo, caminho, corpo_json, token) -> imprime "STATUS\ncorpo"
req() {
  local m=$1 p=$2 b=$3 t=$4
  local args=(-sS -o /tmp/_corpo -w '%{http_code}' -X "$m" "$API$p")
  [ -n "$b" ] && args+=(-H 'Content-Type: application/json' -d "$b")
  [ -n "$t" ] && args+=(-H "Authorization: Bearer $t")
  local st; st=$(curl "${args[@]}")
  echo "$st"; cat /tmp/_corpo
}

j() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(eval('('+JSON.parse(JSON.stringify(d))+')')?'':'')}catch(e){}})" ; }
campo() { node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('/tmp/_corpo','utf8'));const p='$1'.split('.');let v=d;for(const k of p)v=v?.[k];console.log(typeof v==='object'?JSON.stringify(v):v)"; }

echo "=============================================="
echo " 1. LOGIN"
echo "=============================================="
st=$(req POST /auth/login '{"email":"nane@pointdanane.com.br","senha":"pointdanane123"}' | head -1)
checa "login com credenciais corretas" 200 "$st" "$(cat /tmp/_corpo)"
TOKEN=$(campo token)
echo "  token recebido: ${TOKEN:0:25}..."

st=$(req POST /auth/login '{"email":"nane@pointdanane.com.br","senha":"senhaerrada"}' | head -1)
checa "login com senha errada e recusado" 401 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /auth/login '{"email":"naoexiste@teste.com","senha":"qualquer123"}' | head -1)
checa "login com e-mail inexistente e recusado" 401 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /auth/login '{"email":"naoehemail","senha":"123"}' | head -1)
checa "login com dados invalidos e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req GET /auth/perfil '' "$TOKEN" | head -1)
checa "perfil com token valido" 200 "$st" "$(cat /tmp/_corpo)"

echo
echo "=============================================="
echo " 2. PORTEIRO (rotas protegidas sem cracha)"
echo "=============================================="
for rota in /itens /promocoes /tarifas /configuracoes; do
  st=$(req GET "$rota" | head -1)
  checa "GET $rota sem token e bloqueado" 401 "$st" "$(cat /tmp/_corpo)"
done
st=$(req GET /itens '' 'token.falso.forjado' | head -1)
checa "GET /itens com token forjado e bloqueado" 401 "$st" "$(cat /tmp/_corpo)"

echo
echo "=============================================="
echo " 3. ITENS DO CARDAPIO"
echo "=============================================="
st=$(req GET '/itens?limite=6&pagina=1' '' "$TOKEN" | head -1)
checa "listar itens paginado" 200 "$st" "$(cat /tmp/_corpo)"
echo "  total: $(campo paginacao.total) | nesta pagina: $(node -e "const d=JSON.parse(require('fs').readFileSync('/tmp/_corpo','utf8'));console.log(d.itens.length)") | paginas: $(campo paginacao.totalPaginas)"
echo "  categorias: $(campo categorias)"

st=$(req GET '/itens?busca=bacon' '' "$TOKEN" | head -1)
checa "buscar itens por texto" 200 "$st" "$(cat /tmp/_corpo)"
echo "  achou: $(node -e "const d=JSON.parse(require('fs').readFileSync('/tmp/_corpo','utf8'));console.log(d.itens.map(i=>i.nome).join(', '))")"

st=$(req GET '/itens?categoria=Bebidas' '' "$TOKEN" | head -1)
checa "filtrar itens por categoria" 200 "$st" "$(cat /tmp/_corpo)"
echo "  bebidas: $(campo paginacao.total)"

st=$(req POST /itens '{"nome":"X-Teste Automatico","descricao":"Criado pelo teste","preco":19.9,"categoria":"Lanches"}' "$TOKEN" | head -1)
checa "criar item" 201 "$st" "$(cat /tmp/_corpo)"
ITEM_ID=$(campo id)
echo "  id criado: $ITEM_ID"

st=$(req POST /itens '{"nome":"X","preco":-5,"categoria":"Lanches"}' "$TOKEN" | head -1)
checa "criar item com preco negativo e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /itens '{"nome":"X-Sem Preco","categoria":"Lanches"}' "$TOKEN" | head -1)
checa "criar item sem preco e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /itens '{"nome":"X-Intruso","preco":10,"categoria":"Lanches","campoInventado":"xxx"}' "$TOKEN" | head -1)
checa "criar item com campo desconhecido e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH "/itens/$ITEM_ID" '{"preco":24.5}' "$TOKEN" | head -1)
checa "editar preco do item" 200 "$st" "$(cat /tmp/_corpo)"
echo "  preco agora: $(campo preco)"

st=$(req PATCH "/itens/$ITEM_ID" '{"ativo":false}' "$TOKEN" | head -1)
checa "desligar item (interruptor)" 200 "$st" "$(cat /tmp/_corpo)"
echo "  ativo agora: $(campo ativo)"

st=$(req PATCH "/itens/00000000-0000-4000-8000-000000000000" '{"preco":10}' "$TOKEN" | head -1)
checa "editar item inexistente da 404" 404 "$st" "$(cat /tmp/_corpo)"

echo
echo "=============================================="
echo " 4. PROMOCOES"
echo "=============================================="
st=$(req GET /promocoes '' "$TOKEN" | head -1)
checa "listar promocoes (ligadas e pausadas)" 200 "$st" "$(cat /tmp/_corpo)"
echo "  total: $(campo paginacao.total)"

st=$(req GET '/promocoes?ativa=false' '' "$TOKEN" | head -1)
checa "filtrar so as pausadas" 200 "$st" "$(cat /tmp/_corpo)"
echo "  pausadas: $(campo paginacao.total)"

# Cria um item PROPRIO para as promocoes se apoiarem.
#
# Antes, o script procurava um item ligado qualquer no banco. Isso dependia
# dos dados de exemplo: com o banco vazio — ou depois de o proprio teste
# desligar o unico item que existia — nao sobrava nenhum, e nove casos
# quebravam em cascata. A bateria agora cria o que precisa e apaga no fim.
st=$(req POST /itens '{"nome":"Item de apoio (teste)","preco":30,"categoria":"Lanches"}' "$TOKEN" | head -1)
checa "criar item de apoio para as promocoes" 201 "$st" "$(cat /tmp/_corpo)"
ITEM_PORCAO=$(campo id)
PRECO_PORCAO=$(campo preco)
PRECO_PROMO=$(node -e "console.log(($PRECO_PORCAO/2).toFixed(2))")

st=$(req POST /promocoes "{\"tipo\":\"desconto_item\",\"itemCardapioId\":\"$ITEM_PORCAO\",\"selo\":\"Teste Desconto\",\"precoPromocional\":$PRECO_PROMO}" "$TOKEN" | head -1)
checa "criar promocao de desconto em item" 201 "$st" "$(cat /tmp/_corpo)"
PROMO_ID=$(campo id)
echo "  precoCheio herdado do item: $(campo precoCheio) (preco do item: $PRECO_PORCAO)"

st=$(req POST /promocoes '{"tipo":"desconto_item","selo":"Sem item","precoPromocional":5}' "$TOKEN" | head -1)
checa "desconto sem item vinculado e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /promocoes "{\"tipo\":\"desconto_item\",\"itemCardapioId\":\"$ITEM_PORCAO\",\"selo\":\"Caro\",\"precoPromocional\":999}" "$TOKEN" | head -1)
checa "promocao mais cara que o preco cheio e recusada" 400 "$st" "$(cat /tmp/_corpo)"
echo "        mensagem: $(campo message)"

st=$(req POST /promocoes '{"tipo":"combo_autonomo","nome":"Combo Teste","selo":"Teste","precoPromocional":49.9,"precoCheio":70}' "$TOKEN" | head -1)
checa "criar combo autonomo" 201 "$st" "$(cat /tmp/_corpo)"
COMBO_ID=$(campo id)

st=$(req POST /promocoes '{"tipo":"combo_autonomo","selo":"Sem nome","precoPromocional":10}' "$TOKEN" | head -1)
checa "combo sem nome e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /promocoes "{\"tipo\":\"combo_autonomo\",\"nome\":\"Misturado\",\"itemCardapioId\":\"$ITEM_PORCAO\",\"selo\":\"X\",\"precoPromocional\":10}" "$TOKEN" | head -1)
checa "combo vinculado a item e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH "/promocoes/$PROMO_ID" '{"ativa":false}' "$TOKEN" | head -1)
checa "pausar promocao (interruptor)" 200 "$st" "$(cat /tmp/_corpo)"

echo
echo "=============================================="
echo " 5. TARIFAS POR BAIRRO"
echo "=============================================="
st=$(req GET '/tarifas?limite=5' '' "$TOKEN" | head -1)
checa "listar bairros paginado (5 por pagina)" 200 "$st" "$(cat /tmp/_corpo)"
echo "  total: $(campo paginacao.total) | paginas: $(campo paginacao.totalPaginas)"

st=$(req POST /tarifas '{"bairro":"Bairro de Teste","valorTaxa":13.5}' "$TOKEN" | head -1)
checa "adicionar bairro" 201 "$st" "$(cat /tmp/_corpo)"
TARIFA_ID=$(campo id)

st=$(req POST /tarifas '{"bairro":"Bairro de Teste","valorTaxa":20}' "$TOKEN" | head -1)
checa "bairro repetido e recusado" 409 "$st" "$(cat /tmp/_corpo)"
echo "        mensagem: $(campo message)"

st=$(req POST /tarifas '{"bairro":"Gratis","valorTaxa":0}' "$TOKEN" | head -1)
checa "taxa zero (entrega gratis) e aceita" 201 "$st" "$(cat /tmp/_corpo)"
GRATIS_ID=$(campo id)

st=$(req POST /tarifas '{"bairro":"Negativo","valorTaxa":-3}' "$TOKEN" | head -1)
checa "taxa negativa e recusada" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH "/tarifas/$TARIFA_ID" '{"valorTaxa":15}' "$TOKEN" | head -1)
checa "editar valor da taxa" 200 "$st" "$(cat /tmp/_corpo)"

st=$(req DELETE "/tarifas/$GRATIS_ID" '' "$TOKEN" | head -1)
checa "remover bairro" 200 "$st" "$(cat /tmp/_corpo)"

echo
echo "=============================================="
echo " 6. CONFIGURACOES"
echo "=============================================="
st=$(req GET /configuracoes '' "$TOKEN" | head -1)
checa "ler configuracoes" 200 "$st" "$(cat /tmp/_corpo)"
echo "  modo: $(campo modoTaxaEntrega) | aberto: $(campo aberto) | pagamentos: $(campo formasPagamento)"

st=$(req PATCH /configuracoes '{"horarioAbertura":"17:00"}' "$TOKEN" | head -1)
checa "mudar horario de abertura" 200 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH /configuracoes '{"horarioAbertura":"25:00"}' "$TOKEN" | head -1)
checa "horario invalido e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH /configuracoes '{"whatsapp":"(11) 98888-7777"}' "$TOKEN" | head -1)
checa "whatsapp com mascara e recusado (faltam digitos)" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH /configuracoes '{"whatsapp":"+55 (11) 98888-7777"}' "$TOKEN" | head -1)
checa "whatsapp com mascara completa e limpo e aceito" 200 "$st" "$(cat /tmp/_corpo)"
echo "  gravado como: $(campo whatsapp)"

st=$(req PATCH /configuracoes '{"modoTaxaEntrega":"unica"}' "$TOKEN" | head -1)
checa "modo unico sem informar a taxa e recusado" 400 "$st" "$(cat /tmp/_corpo)"
echo "        mensagem: $(campo message)"

st=$(req PATCH /configuracoes '{"modoTaxaEntrega":"unica","taxaEntregaUnica":8.5}' "$TOKEN" | head -1)
checa "modo unico com taxa e aceito" 200 "$st" "$(cat /tmp/_corpo)"

st=$(req GET /cardapio | head -1)
checa "cardapio publico reflete o modo unico" 200 "$st" "$(cat /tmp/_corpo)"
echo "  entrega: $(campo entrega)"

st=$(req PATCH /configuracoes '{"modoTaxaEntrega":"por_bairro"}' "$TOKEN" | head -1)
checa "voltar para modo por bairro" 200 "$st" "$(cat /tmp/_corpo)"
echo "  taxaUnica limpa: $(campo taxaEntregaUnica)"

st=$(req PATCH /configuracoes '{"formasPagamento":["pix","bitcoin"]}' "$TOKEN" | head -1)
checa "forma de pagamento invalida e recusada" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH /configuracoes '{"formasPagamento":[]}' "$TOKEN" | head -1)
checa "lista de pagamento vazia e recusada" 400 "$st" "$(cat /tmp/_corpo)"

echo
echo "=============================================="
echo " 6b. FOTOS"
echo "=============================================="
# Um PNG de 1x1: o menor arquivo de imagem que existe.
PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

st=$(req PUT "/itens/$ITEM_PORCAO/foto" "{\"dados\":\"$PNG\",\"tipo\":\"image/png\"}" "$TOKEN" | head -1)
checa "enviar foto do item" 200 "$st" "$(cat /tmp/_corpo)"
CAMINHO_FOTO=$(campo fotoUrl)
echo "  caminho: $CAMINHO_FOTO"

# A foto e PUBLICA: quem abre o cardapio nao esta logado.
st=$(req GET "$CAMINHO_FOTO" | head -1)
checa "foto e servida sem login" 200 "$st" "$(cat /tmp/_corpo | head -c 60)"

st=$(req PUT "/itens/$ITEM_PORCAO/foto" "{\"dados\":\"$PNG\",\"tipo\":\"image/gif\"}" "$TOKEN" | head -1)
checa "formato nao aceito e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PUT "/itens/$ITEM_PORCAO/foto" '{"dados":"!!!nao e base64!!!","tipo":"image/png"}' "$TOKEN" | head -1)
checa "conteudo que nao e imagem e recusado" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PUT "/itens/$ITEM_PORCAO/foto" "{\"dados\":\"$PNG\",\"tipo\":\"image/png\"}" | head -1)
checa "enviar foto sem token e bloqueado" 401 "$st" "$(cat /tmp/_corpo)"

st=$(req DELETE "/itens/$ITEM_PORCAO/foto" '' "$TOKEN" | head -1)
checa "remover a foto do item" 200 "$st" "$(cat /tmp/_corpo)"
echo "  fotoUrl agora: $(campo fotoUrl)"

echo
echo "=============================================="
echo " 7. LIMPEZA"
echo "=============================================="
st=$(req DELETE "/promocoes/$PROMO_ID" '' "$TOKEN" | head -1); checa "remover promocao de teste" 200 "$st" "$(cat /tmp/_corpo)"
st=$(req DELETE "/promocoes/$COMBO_ID" '' "$TOKEN" | head -1); checa "remover combo de teste" 200 "$st" "$(cat /tmp/_corpo)"
st=$(req DELETE "/itens/$ITEM_PORCAO" '' "$TOKEN" | head -1)
checa "remover item de apoio" 200 "$st" "$(cat /tmp/_corpo)"

st=$(req DELETE "/itens/$ITEM_ID" '' "$TOKEN" | head -1);      checa "remover item de teste" 200 "$st" "$(cat /tmp/_corpo)"
st=$(req DELETE "/tarifas/$TARIFA_ID" '' "$TOKEN" | head -1);  checa "remover bairro de teste" 200 "$st" "$(cat /tmp/_corpo)"
req PATCH /configuracoes '{"horarioAbertura":"18:00","whatsapp":"5511999998888"}' "$TOKEN" > /dev/null

echo
echo "=============================================="
echo " 8. FORCA BRUTA NO LOGIN"
echo "=============================================="
# O e-mail leva a hora no nome: cada rodada comeca com o contador zerado,
# entao a bateria pode rodar de novo sem esperar os 15 minutos da trava.
ALVO="bloqueio-$(date +%s%N)@teste.com"

# 7 caracteres: passava na regra antiga (6) e nao passa na nova (8).
st=$(req POST /auth/login "{\"email\":\"$ALVO\",\"senha\":\"sete123\"}" | head -1)
checa "senha menor que o minimo e recusada antes de consultar o banco" 400 "$st" "$(cat /tmp/_corpo)"

for tentativa in 1 2 3 4 5; do
  st=$(req POST /auth/login "{\"email\":\"$ALVO\",\"senha\":\"senhaerrada123\"}" | head -1)
  checa "tentativa $tentativa de 5 ainda responde recusa normal" 401 "$st" "$(cat /tmp/_corpo)"
done

st=$(req POST /auth/login "{\"email\":\"$ALVO\",\"senha\":\"senhaerrada123\"}" | head -1)
checa "a 6a tentativa e travada" 429 "$st" "$(cat /tmp/_corpo)"
echo "  resposta: $(campo message)"

if echo "$(cat /tmp/_corpo)" | grep -qi "minuto"; then
  checa "a trava diz quanto tempo esperar" sim sim ''
else
  checa "a trava diz quanto tempo esperar" sim nao "$(cat /tmp/_corpo)"
fi

# A trava e por e-mail: travar um invasor nao pode deixar a Nane de fora.
st=$(req POST /auth/login '{"email":"nane@pointdanane.com.br","senha":"pointdanane123"}' | head -1)
checa "a dona continua entrando normalmente" 200 "$st" "$(cat /tmp/_corpo)"

echo
echo "=============================================="
echo " 9. TROCAR A SENHA"
echo "=============================================="
ORIGINAL='pointdanane123'
NOVA='senhatrocada456'

st=$(req PATCH /auth/senha "{\"senhaAtual\":\"$ORIGINAL\",\"senhaNova\":\"$NOVA\"}" | head -1)
checa "trocar senha sem token e bloqueado" 401 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH /auth/senha "{\"senhaAtual\":\"naoehaminha99\",\"senhaNova\":\"$NOVA\"}" "$TOKEN" | head -1)
checa "senha atual errada e recusada" 401 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH /auth/senha "{\"senhaAtual\":\"$ORIGINAL\",\"senhaNova\":\"sete123\"}" "$TOKEN" | head -1)
checa "senha nova curta demais e recusada" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH /auth/senha "{\"senhaAtual\":\"$ORIGINAL\",\"senhaNova\":\"$ORIGINAL\"}" "$TOKEN" | head -1)
checa "senha nova igual a atual e recusada" 400 "$st" "$(cat /tmp/_corpo)"

st=$(req PATCH /auth/senha "{\"senhaAtual\":\"$ORIGINAL\",\"senhaNova\":\"$NOVA\"}" "$TOKEN" | head -1)
checa "a troca acontece" 200 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /auth/login "{\"email\":\"nane@pointdanane.com.br\",\"senha\":\"$NOVA\"}" | head -1)
checa "login com a senha NOVA funciona" 200 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /auth/login "{\"email\":\"nane@pointdanane.com.br\",\"senha\":\"$ORIGINAL\"}" | head -1)
checa "login com a senha VELHA nao funciona mais" 401 "$st" "$(cat /tmp/_corpo)"

# Devolve a senha original: a bateria nao pode deixar rastro.
st=$(req PATCH /auth/senha "{\"senhaAtual\":\"$NOVA\",\"senhaNova\":\"$ORIGINAL\"}" "$TOKEN" | head -1)
checa "senha devolvida ao original (limpeza)" 200 "$st" "$(cat /tmp/_corpo)"

st=$(req POST /auth/login "{\"email\":\"nane@pointdanane.com.br\",\"senha\":\"$ORIGINAL\"}" | head -1)
checa "a senha original vale de novo" 200 "$st" "$(cat /tmp/_corpo)"

echo
echo "=============================================="
echo " RESULTADO: $ok passaram, $falhou falharam"
echo "=============================================="
[ "$falhou" -eq 0 ]
