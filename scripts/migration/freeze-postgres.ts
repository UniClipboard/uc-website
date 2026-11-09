import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.migration-production", quiet: true });
const tables = [
  "articles",
  "article_translations",
  "api_tokens",
  "releases",
  "founders",
  "ios_beta_signups",
  "sponsors",
  "sponsor_invites",
  "shareholders",
];
const trigger = "uc_website_migration_readonly";
const command = process.argv[2];
async function main() {
  if (
    !process.env.DATABASE_URL ||
    !["rehearse", "apply", "release"].includes(command)
  )
    throw new Error(
      "Use freeze-postgres.ts rehearse|apply|release with the source DATABASE_URL",
    );
  const source = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    await source.begin(async (tx) => {
      if (command === "release") {
        const [fn] =
          await tx`SELECT prosrc FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = ${trigger}`;
        if (!fn || !fn.prosrc.includes("UC_WEBSITE_MIGRATION_FREEZE"))
          throw new Error("Migration freeze identity does not match");
        for (const table of tables)
          await tx.unsafe(`DROP TRIGGER IF EXISTS "${trigger}" ON "${table}"`);
        await tx.unsafe(`DROP FUNCTION public.${trigger}()`);
      } else {
        await tx.unsafe(
          `CREATE FUNCTION public.${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'UC_WEBSITE_MIGRATION_FREEZE: writes are disabled during migration' USING ERRCODE = '25006'; END $$`,
        );
        for (const table of tables)
          await tx.unsafe(
            `CREATE TRIGGER "${trigger}" BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON "${table}" FOR EACH STATEMENT EXECUTE FUNCTION public.${trigger}()`,
          );
        const [{ count }] =
          await tx`SELECT count(*)::int AS count FROM pg_trigger WHERE tgname = ${trigger}`;
        if (count !== tables.length) throw new Error("Incomplete write freeze");
        if (command === "rehearse")
          await tx`UPDATE articles SET slug = slug WHERE false`;
      }
    });
    console.log(
      JSON.stringify({
        status: command === "release" ? "writes-restored" : "writes-frozen",
        tables: tables.length,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    if (
      command === "rehearse" &&
      error instanceof Error &&
      error.message.includes("UC_WEBSITE_MIGRATION_FREEZE")
    ) {
      console.log(
        JSON.stringify({ status: "rehearsal-passed-and-rolled-back" }),
      );
    } else throw error;
  } finally {
    await source.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
