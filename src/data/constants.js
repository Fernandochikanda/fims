import { getTemplate } from './clientTemplates';

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

export const INSPECTOR_COLORS = {
  4: "#378ADD", // Blue
  5: "#0F6E56", // Green
  6: "#534AB7", // Purple
  7: "#BA7517"  // Orange
};

export const PRIORITY_LEVELS = {
  emergency: { label: "Emergency", color: "#A32D2D" },
  high: { label: "High", color: "#EF9F27" },
  medium: { label: "Medium", color: "#FAC775" },
  normal: { label: "Normal", color: "#3B6D11" },
  low: { label: "Low", color: "#888888" }
};

export const SEED_LOCATIONS = [
  { id: 1, name: "Baker Hughes", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Baker Hughes") },
  { id: 2, name: "Bayport", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Bayport") },
  { id: 3, name: "Biofund", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Biofund") },
  { id: 4, name: "Broll S & C", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Broll S & C") },
  { id: 5, name: "Casino", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Casino") },
  { id: 6, name: "Civitas", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Civitas") },
  { id: 7, name: "C. Belga", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("C. Belga") },
  { id: 8, name: "C. Belga Berreau", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("C. Belga Berreau") },
  { id: 9, name: "Comité Olímpico", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Comité Olímpico") },
  { id: 10, name: "Commotor GMS", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Commotor GMS") },
  { id: 11, name: "Condomínio JN130", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Condomínio JN130") },
  { id: 12, name: "EGPAF", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("EGPAF") },
  { id: 13, name: "ExxonMobil", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("ExxonMobil") },
  { id: 14, name: "FCDO", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("FCDO") },
  { id: 15, name: "GAPI", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("GAPI") },
  { id: 16, name: "Gestão de Terminais K4", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Gestão de Terminais K4") },
  { id: 17, name: "GDA", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("GDA") },
  { id: 18, name: "Hollard Seguros R/C", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Hollard Seguros R/C") },
  { id: 19, name: "Hollard Seguros 4º", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Hollard Seguros 4º") },
  { id: 20, name: "Intercar KIA", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Intercar KIA") },
  { id: 21, name: "ISCTEM 1", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("ISCTEM 1") },
  { id: 22, name: "ISCTEM 2", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("ISCTEM 2") },
  { id: 23, name: "Karingani", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Karingani") },
  { id: 24, name: "Multi Choice Torres Rani", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Multi Choice Torres Rani") },
  { id: 25, name: "Pronova", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Pronova") },
  { id: 26, name: "Radisson", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Radisson") },
  { id: 27, name: "Shopping 24", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Shopping 24") },
  { id: 28, name: "Siemens", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Siemens") },
  { id: 29, name: "SIP", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("SIP") },
  { id: 30, name: "Tec. Indus. Museu", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Tec. Indus. Museu") },
  { id: 31, name: "Techvision Alto Maé", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Techvision Alto Maé") },
  { id: 32, name: "Techvision Import", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Techvision Import") },
  { id: 33, name: "Techvision Group", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Techvision Group") },
  { id: 34, name: "Torre Azul", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Torre Azul") },
  { id: 35, name: "Torre Indico", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Torre Indico") },
  { id: 36, name: "Torres Rani", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Torres Rani") },
  { id: 37, name: "Torres VBC-INSS", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Torres VBC-INSS") },
  { id: 38, name: "Xiluva", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Xiluva") },
  { id: 39, name: "Zimpeto Square", address: "Av. de Moçambique, Maputo", supervisor_id: 3, getTemplate: () => getTemplate("Zimpeto Square") },
  { id: 40, name: "Broll Acacia Estate", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Broll Acacia Estate") },
  { id: 41, name: "Jogabet", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Jogabet") },
  { id: 42, name: "Multi Choice Maputo", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Multi Choice Maputo") },
  { id: 43, name: "Kactus", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Kactus") },
  { id: 44, name: "Motraco", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Motraco") },
  { id: 45, name: "Gestfuel Mussumbuluco", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Gestfuel Mussumbuluco") },
  { id: 46, name: "Gestfuel Estrada Velha", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Gestfuel Estrada Velha") },
  { id: 47, name: "Aura Residence", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Aura Residence") },
  { id: 48, name: "MC Dermott", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("MC Dermott") },
  { id: 49, name: "Hollard Seguros R/C GA", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Hollard Seguros R/C GA") },
  { id: 50, name: "Hollard Seguros R/C GA 3º Andar", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Hollard Seguros R/C GA 3º Andar") },
  { id: 51, name: "Hollard Seguros R/C GA 4º Andar", address: "Maputo, Moçambique", supervisor_id: 3, getTemplate: () => getTemplate("Hollard Seguros R/C GA 4º Andar") }
];

export const TEMPLATE_SECTIONS = getTemplate("Baker Hughes").sections;
export const TOTAL_POSSIBLE = TEMPLATE_SECTIONS.reduce((sum, s) => sum + s.items.reduce((ss, i) => ss + i.max, 0), 0);
