// 사용자 관련 타입 정의
import { TEAM_MEMBERS } from "@/lib/constants/team";

export type TeamMemberName = keyof typeof TEAM_MEMBERS;

export interface User {
  name: TeamMemberName;
  role: string;
  initial: string;
  color: string;
}

export function getUserInfo(name: string): User {
  const member = TEAM_MEMBERS[name as TeamMemberName];
  if (member) {
    return member;
  }
  // 기본값 반환
  return {
    name: name as TeamMemberName,
    role: "Member",
    initial: name[0] || "?",
    color: "#6B7280",
  };
}

