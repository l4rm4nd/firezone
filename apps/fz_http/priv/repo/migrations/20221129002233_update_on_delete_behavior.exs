defmodule FzHttp.Repo.Migrations.UpdateOnDeleteBehavior do
  use Ecto.Migration

  def change do
    execute("ALTER TABLE oidc_connections DROP CONSTRAINT IF EXISTS oidc_connections_user_id_fkey")
    execute("ALTER TABLE oidc_connections ADD CONSTRAINT oidc_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE")

    execute("ALTER TABLE mfa_methods DROP CONSTRAINT IF EXISTS mfa_methods_user_id_fkey")
    execute("ALTER TABLE mfa_methods ADD CONSTRAINT mfa_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE")
  end
end
