export const ROLES = { ADMIN: "admin", CEO: "ceo", SUPERVISOR: "supervisor", INSPECTOR: "inspector" };

export const SEED_USERS = [
  { id: 1, name: "Sistema Admin", email: "admin@fims.co.mz", role: ROLES.ADMIN, active: true, avatar: "SA" },
  { id: 2, name: "Carlos Machava", email: "ceo@fims.co.mz", role: ROLES.CEO, active: true, avatar: "CM" },
  { id: 3, name: "Ana Sitoe", email: "supervisor@fims.co.mz", role: ROLES.SUPERVISOR, active: true, avatar: "AS" },
  { id: 4, name: "João Tembe", email: "inspector1@fims.co.mz", role: ROLES.INSPECTOR, active: true, avatar: "JT" },
  { id: 5, name: "Maria Nhantumbo", email: "inspector2@fims.co.mz", role: ROLES.INSPECTOR, active: true, avatar: "MN" },
  { id: 6, name: "Carlos Mondlane", email: "inspector3@fims.co.mz", role: ROLES.INSPECTOR, active: true, avatar: "CM" },
  { id: 7, name: "Rita Macuácua", email: "inspector4@fims.co.mz", role: ROLES.INSPECTOR, active: true, avatar: "RM" },
];

export const SEED_LOCATIONS = [
  { id: 1, name: "Baker Hughes", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 2, name: "Bayport", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 3, name: "Biofund", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 4, name: "Broll S & C", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 5, name: "Casino", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 6, name: "Civitas", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 7, name: "C. Belga", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 8, name: "C. Belga Berreau", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 9, name: "Comité Olímpico", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 10, name: "Commotor GMS", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 11, name: "Condomínio JN130", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 12, name: "EGPAF", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 13, name: "ExxonMobil", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 14, name: "FCDO", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 15, name: "GAPI", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 16, name: "Gestão de Terminais K4", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 17, name: "GDA", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 18, name: "Hollard Seguros R/C", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 19, name: "Hollard Seguros 4º", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 20, name: "Intercar KIA", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 21, name: "ISCTEM 1", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 22, name: "ISCTEM 2", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 23, name: "Karingani", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 24, name: "Multi Choice Torres Rani", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 25, name: "Pronova", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 26, name: "Radisson", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 27, name: "Shopping 24", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 28, name: "Siemens", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 29, name: "SIP", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 30, name: "Tec. Indus. Museu", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 31, name: "Techvision Alto Maé", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 32, name: "Techvision Import", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 33, name: "Techvision Group", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 34, name: "Torre Azul", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 35, name: "Torre Indico", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 36, name: "Torres Rani", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 37, name: "Torres VBC-INSS", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 38, name: "Xiluva", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 39, name: "Zimpeto Square", address: "Av. de Moçambique, Maputo", supervisor_id: 3 },
  { id: 40, name: "Broll Acacia Estate", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 41, name: "Jogabet", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 42, name: "Multi Choice Maputo", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 43, name: "Kactus", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 44, name: "Motraco", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 45, name: "Gestfuel Mussumbuluco", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 46, name: "Gestfuel Estrada Velha", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 47, name: "Aura Residence", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 48, name: "MC Dermott", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 49, name: "Hollard Seguros R/C GA", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 50, name: "Hollard Seguros R/C GA 3º Andar", address: "Maputo, Moçambique", supervisor_id: 3 },
  { id: 51, name: "Hollard Seguros R/C GA 4º Andar", address: "Maputo, Moçambique", supervisor_id: 3 }
];

export const TEMPLATE_SECTIONS = [
  {
    id: "pessoal", name: "Pessoal de Limpeza", items: [
      { id: "p1", text: "Todos os funcionários têm uniforme limpo e engomado?", max: 5 },
      { id: "p2", text: "Todos os funcionários estão asseados e profissionais?", max: 5 },
      { id: "p3", text: "São treinados adequadamente nas tarefas regularmente?", max: 5 },
      { id: "p4", text: "Estão seguindo as regras de segurança?", max: 5 },
      { id: "p5", text: "O local de equipamentos e material está limpo e organizado?", max: 5 },
      { id: "p6", text: "A Administração está feliz com o desempenho das funções?", max: 5 },
    ]
  },
  {
    id: "gabinetes", name: "Gabinetes", items: [
      { id: "g1", text: "O tapete é aspirado regularmente?", max: 5 },
      { id: "g2", text: "Os cantos e bordas são aspirados regularmente?", max: 5 },
      { id: "g3", text: "Existem muitos pontos e manchas no tapete?", max: 5 },
      { id: "g4", text: "O chão é limpo e lavado regularmente?", max: 5 },
      { id: "g5", text: "Argamassa limpa?", max: 5 },
      { id: "g6", text: "Rodapés limpos, sem poeira e manchas?", max: 5 },
      { id: "g7", text: "As bordas e cantos estão livres de teias e poeira?", max: 5 },
      { id: "g8", text: "A parede está livre de manchas, pichações, etc.?", max: 5 },
      { id: "g9", text: "Portas limpas e livres de impressões digitais e manchas?", max: 5 },
      { id: "g10", text: "O tampo das mesas está livre de poeira?", max: 5 },
      { id: "g11", text: "Todas as cadeiras estão livres de pó?", max: 5 },
      { id: "g12", text: "Os recipientes de lixo são esvaziados regularmente?", max: 5 },
      { id: "g13", text: "Todas as janelas estão livres de manchas e impressões digitais?", max: 5 },
    ]
  },
  {
    id: "copas", name: "Copas / Copa", items: [
      { id: "c1", text: "O chão é limpo e lavado regularmente?", max: 5 },
      { id: "c2", text: "Rodapés limpos, sem poeira e manchas?", max: 5 },
      { id: "c3", text: "A geleira é limpa dentro e fora regularmente?", max: 5 },
      { id: "c4", text: "A chaleira é limpa regularmente?", max: 5 },
      { id: "c5", text: "O microondas é limpo regularmente?", max: 5 },
      { id: "c6", text: "O lavatório e torneira são limpos regularmente?", max: 5 },
      { id: "c7", text: "Os armários estão limpos e livres de migalhas?", max: 5 },
      { id: "c8", text: "Toda a loiça é lavada e arrumada devidamente?", max: 5 },
    ]
  },
  {
    id: "casas_banho", name: "Casas de Banho", items: [
      { id: "b1", text: "Todos os dispensadores estão limpos e devidamente recarregados?", max: 5 },
      { id: "b2", text: "Todos os dispensadores estão em boas condições?", max: 5 },
      { id: "b3", text: "Os cantos e bordas são varridos ou aspirados completamente?", max: 5 },
      { id: "b4", text: "Todas as pias estão livres de manchas de água e limpas?", max: 5 },
      { id: "b5", text: "As peças de aço inoxidável são polidas e livres de manchas?", max: 5 },
      { id: "b6", text: "Todos os banheiros/urinóis estão livres de manchas?", max: 5 },
      { id: "b7", text: "Existe problema de mau cheiro?", max: 5 },
      { id: "b8", text: "O chão é limpo diariamente com limpador desinfetante?", max: 5 },
      { id: "b9", text: "Todas as latas de lixo são esvaziadas e limpas regularmente?", max: 5 },
    ]
  },
];

export const TOTAL_POSSIBLE = TEMPLATE_SECTIONS.reduce((sum, s) => sum + s.items.reduce((ss, i) => ss + i.max, 0), 0);
