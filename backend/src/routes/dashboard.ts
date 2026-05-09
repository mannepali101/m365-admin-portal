import { Router } from 'express';
import { buildGraphClient } from '../services/graphClient.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

// ──────────────────────────────────────────────────────────────────
// GET /api/dashboard/summary
// Aggregates key metrics for the dashboard overview widgets.
// Fetches in parallel to minimise latency.
// ──────────────────────────────────────────────────────────────────
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const client = buildGraphClient(req.accessToken!);

    const [usersResult, devicesResult, groupsResult, orgResult, skusResult] =
      await Promise.allSettled([
        // Total & enabled users (top-1 with $count for efficiency)
        client.api('/users').select('id,accountEnabled').top(999).count(true).get(),

        // Intune managed devices
        client
          .api('/deviceManagement/managedDevices')
          .select('id,complianceState')
          .top(999)
          .get(),

        // Groups count
        client.api('/groups').select('id').top(1).count(true).get(),

        // Org details
        client.api('/organization').select('displayName,verifiedDomains,assignedPlans').get(),

        // License SKUs
        client
          .api('/subscribedSkus')
          .select('skuPartNumber,prepaidUnits,consumedUnits,capabilityStatus')
          .get(),
      ]);

    // --- Users ---
    const usersData = usersResult.status === 'fulfilled' ? usersResult.value : null;
    const allUsers: any[] = usersData?.value ?? [];
    const totalUsers = usersData?.['@odata.count'] ?? allUsers.length;
    const enabledUsers = allUsers.filter((u: any) => u.accountEnabled).length;

    // --- Devices ---
    const devices: any[] =
      devicesResult.status === 'fulfilled' ? devicesResult.value.value : [];
    const compliantDevices = devices.filter((d: any) => d.complianceState === 'compliant').length;
    const nonCompliantDevices = devices.filter((d: any) => d.complianceState === 'noncompliant').length;

    // --- Groups ---
    const totalGroups =
      groupsResult.status === 'fulfilled'
        ? (groupsResult.value['@odata.count'] ?? 0)
        : 0;

    // --- Org ---
    const orgs: any[] =
      orgResult.status === 'fulfilled' ? orgResult.value.value ?? [] : [];
    const org = orgs[0] ?? {};

    // --- Licenses ---
    const skus: any[] =
      skusResult.status === 'fulfilled' ? skusResult.value.value ?? [] : [];

    const licenseStats = skus
      .filter((s: any) => s.capabilityStatus === 'Enabled')
      .map((s: any) => ({
        skuPartNumber: s.skuPartNumber,
        total: s.prepaidUnits?.enabled ?? 0,
        consumed: s.consumedUnits ?? 0,
        available: (s.prepaidUnits?.enabled ?? 0) - (s.consumedUnits ?? 0),
      }));

    const totalLicenses = licenseStats.reduce((acc: number, s: any) => acc + s.total, 0);
    const consumedLicenses = licenseStats.reduce((acc: number, s: any) => acc + s.consumed, 0);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          enabled: enabledUsers,
          disabled: totalUsers - enabledUsers,
        },
        devices: {
          total: devices.length,
          compliant: compliantDevices,
          nonCompliant: nonCompliantDevices,
          pending: devices.length - compliantDevices - nonCompliantDevices,
        },
        groups: {
          total: totalGroups,
        },
        licenses: {
          total: totalLicenses,
          consumed: consumedLicenses,
          available: totalLicenses - consumedLicenses,
          skus: licenseStats,
        },
        organization: {
          name: org.displayName ?? 'Unknown',
          domains: (org.verifiedDomains ?? []).map((d: any) => d.name),
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

// ──────────────────────────────────────────────────────────────────
// GET /api/dashboard/recent-activity
// Last 20 Entra ID sign-in / audit events
// ──────────────────────────────────────────────────────────────────
router.get(
  '/recent-activity',
  asyncHandler(async (req, res) => {
    const client = buildGraphClient(req.accessToken!);

    const activity = await client
      .api('/auditLogs/directoryAudits')
      .top(20)
      .orderby('activityDateTime desc')
      .select('id,activityDateTime,activityDisplayName,initiatedBy,targetResources,result')
      .get()
      .catch(() => ({ value: [] }));

    res.json({ success: true, data: activity.value ?? [] });
  }),
);

export default router;
