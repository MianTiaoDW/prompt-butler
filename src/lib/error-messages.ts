export interface UserFacingError {
  message: string;
  technicalDetails: string;
}

export function toUserFacingError(error: unknown): UserFacingError {
  const technicalDetails = error instanceof Error ? error.message : String(error || "未知错误");
  const normalized = technicalDetails.toLowerCase();

  if (
    normalized.includes("负载已饱和") ||
    normalized.includes("上游负载") ||
    normalized.includes("overloaded") ||
    normalized.includes("overload")
  ) {
    return {
      message: "当前生图通道繁忙，请稍后重试或更换令牌分组。",
      technicalDetails
    };
  }
  if (normalized.includes("quota") || normalized.includes("insufficient") || normalized.includes("429")) {
    return {
      message: "图片生成额度不足，请检查生图 API Key、账户余额或模型权限。",
      technicalDetails
    };
  }
  if (normalized.includes("401") || normalized.includes("403") || normalized.includes("unauthorized")) {
    return {
      message: "生图服务认证失败，请检查 API Key 和模型权限。",
      technicalDetails
    };
  }
  if (normalized.includes("timeout") || normalized.includes("timed out") || normalized.includes("超时")) {
    return {
      message: "图片生成等待超时，请稍后重试。",
      technicalDetails
    };
  }
  if (normalized.includes("network") || normalized.includes("failed to fetch")) {
    return {
      message: "无法连接生图服务，请检查网络和 Base URL。",
      technicalDetails
    };
  }

  return {
    message: "图片生成失败，请检查配置后重试。",
    technicalDetails
  };
}
