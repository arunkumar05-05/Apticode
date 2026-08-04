export function paginate(page: number = 1, limit: number = 20) {
  const safePage = Math.max(1, parseInt(String(page), 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const skip = (safePage - 1) * safeLimit;
  return { skip, take: safeLimit, page: safePage, limit: safeLimit };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}