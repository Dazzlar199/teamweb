// 사용자 관련 타입 정의
import { TEAM_MEMBERS } from "@/lib/constants/team";

export type TeamMemberName = keyof typeof TEAM_MEMBERS;

export interface User {
  name: string; // TeamMemberName이 아닌 일반 string으로 변경하여 새로운 사용자도 허용
  role: string;
  initial: string;
  color: string;
  isAdmin?: boolean; // 관리자 여부
}

export function getUserInfo(name: string): User {
  const member = TEAM_MEMBERS[name as TeamMemberName];
  if (member) {
    return {
      ...member,
      isAdmin: name === "김찬주", // 김찬주만 총관리자
    };
  }
  // 기본값 반환
  return {
    name: name,
    role: "Member",
    initial: name[0] || "?",
    color: "#6B7280",
    isAdmin: false,
  };
}

/**
 * 사용자가 관리자인지 확인
 */
export function isAdmin(user: User | null): boolean {
  return user?.isAdmin === true || user?.name === "김찬주";
}

/**
 * 사용자가 특정 리소스의 소유자인지 또는 관리자인지 확인
 */
export function canModify(user: User | null, resourceAuthor: string): boolean {
  if (!user) return false;
  return isAdmin(user) || user.name === resourceAuthor;
}

