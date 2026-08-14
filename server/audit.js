export async function logAudit(prisma, { actorId, action, targetUserId = null, ip = null, metadata = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetUserId,
        ip,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    // Audit logging must never break the main request flow.
    console.error('Audit log write failed:', err.message);
  }
}