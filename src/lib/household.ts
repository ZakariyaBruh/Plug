/*
 * RETIRED. Household — one subscription covering two people — is gone.
 *
 * This file granted, renewed and revoked the second seat: it made a free
 * hidden membership on the Premium product, wrote the owner into its
 * metadata, and took it away again when the owner stopped paying. All of
 * that is removed rather than disabled, because the thing it built was a
 * Premium membership that costs nothing, and dormant code that can do that
 * is not dormant, it is waiting.
 *
 * Nobody was stranded by the removal: all three Whop plans behind it —
 * household monthly, household yearly and the free seat — had never had a
 * single member. That is the only painless moment to withdraw an offer, and
 * it was taken.
 *
 * The file survives as an empty module only because it could not be deleted
 * from this environment. Delete it, along with components/HouseholdSeats.tsx
 * and scripts/household-test.mjs; the two routes that used it are tombstones
 * of their own, and say so.
 */
export {}
