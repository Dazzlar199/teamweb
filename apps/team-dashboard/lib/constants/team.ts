// 팀원 정보
export const TEAM_MEMBERS = {
  '김찬주': {
    name: '김찬주',
    role: 'CEO',
    initial: '김',
    color: '#2563EB',
  },
  '박건희': {
    name: '박건희',
    role: 'CTO',
    initial: '박',
    color: '#10B981',
  },
  '이나영': {
    name: '이나영',
    role: 'CDO',
    initial: '이',
    color: '#F59E0B',
  },
  '김예린': {
    name: '김예린',
    role: 'CMO',
    initial: '예',
    color: '#A855F7',
  },
} as const;

export const TEAM_MEMBER_NAMES = Object.keys(TEAM_MEMBERS) as Array<keyof typeof TEAM_MEMBERS>;

