// 통합 에러 핸들링 유틸리티

export interface ErrorContext {
  component: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public context: ErrorContext,
    public originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * 에러를 처리하고 로깅합니다.
 * @param error - 에러 객체
 * @param context - 에러 발생 컨텍스트
 * @param showToUser - 사용자에게 알림 표시 여부
 */
export function handleError(
  error: unknown,
  context: ErrorContext,
  showToUser = false
): void {
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // 콘솔에 에러 로깅
  console.error(
    `[${context.component}] ${context.action}:`,
    errorMessage,
    {
      context,
      stack: errorStack,
      metadata: context.metadata,
    }
  );

  // 사용자에게 알림 표시 (필요시)
  if (showToUser) {
    // TODO: 토스트 알림 시스템 연동
    alert(`오류가 발생했습니다: ${errorMessage}`);
  }

  // 프로덕션 환경에서는 에러 로깅 서비스로 전송
  if (process.env.NODE_ENV === "production") {
    // TODO: Sentry, LogRocket 등 에러 로깅 서비스 연동
  }
}

/**
 * 안전하게 함수를 실행하고 에러를 처리합니다.
 */
export function safeExecute<T>(
  fn: () => T,
  context: ErrorContext,
  defaultValue?: T
): T | undefined {
  try {
    return fn();
  } catch (error) {
    handleError(error, context);
    return defaultValue;
  }
}

/**
 * 비동기 함수를 안전하게 실행하고 에러를 처리합니다.
 */
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  context: ErrorContext,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    return defaultValue;
  }
}

