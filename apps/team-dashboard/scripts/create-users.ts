/**
 * Supabase 사용자 계정 생성 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/create-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEAM_MEMBERS = [
  { name: '김찬주', email: 'chanju@example.com' },
  { name: '박건희', email: 'geonhee@example.com' },
  { name: '이나영', email: 'nayoung@example.com' },
  { name: '김예린', email: 'yerin@example.com' },
];

const PASSWORD = 'nca1234';

async function createUsers() {
  console.log('🚀 팀원 계정 생성 시작...\n');

  for (const member of TEAM_MEMBERS) {
    console.log(`📝 ${member.name} (${member.email}) 계정 생성 중...`);

    try {
      // 회원가입 시도
      const { data, error } = await supabase.auth.signUp({
        email: member.email,
        password: PASSWORD,
        options: {
          data: {
            name: member.name,
          },
        },
      });

      if (error) {
        // 이미 계정이 존재하는 경우
        if (error.message.includes('already registered')) {
          console.log(`✅ ${member.name}: 이미 존재하는 계정\n`);
        } else {
          console.error(`❌ ${member.name}: ${error.message}\n`);
        }
      } else {
        console.log(`✅ ${member.name}: 계정 생성 완료!`);
        console.log(`   User ID: ${data.user?.id}`);
        console.log(`   Email: ${data.user?.email}\n`);
      }
    } catch (err) {
      console.error(`❌ ${member.name}: 오류 발생`, err);
    }

    // API rate limit 방지를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 계정 생성 완료!');
  console.log('\n📋 로그인 정보:');
  console.log('─────────────────────────────');
  TEAM_MEMBERS.forEach(member => {
    console.log(`${member.name}: ${member.email} / ${PASSWORD}`);
  });
  console.log('─────────────────────────────\n');
}

createUsers().catch(console.error);
