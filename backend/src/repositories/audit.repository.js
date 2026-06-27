const { query } = require('../config/database');
const logger = require('../config/logger');

class AuditRepository {
  async log({ action, entiteType, entiteId, utilisateurId, details, ipAddress }) {
    await query(
      `INSERT INTO audit_log (action, entite_type, entite_id, utilisateur_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        action,
        entiteType || null,
        entiteId || null,
        utilisateurId || null,
        details ? JSON.stringify(details) : null,
        ipAddress || null
      ]
    );
    logger.info(`[AUDIT] ${action}`, { entiteType, entiteId, utilisateurId });
  }
}

module.exports = new AuditRepository();
