-- Gets the 10 most recent login history entries for a given user ID
CREATE OR REPLACE FUNCTION get_user_login_history(p_user_id INTEGER)
RETURNS TABLE(id INT, logged_in_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT lh.id, lh."loggedInAt"
    FROM "LoginHistory" AS lh
    WHERE lh."userId" = p_user_id
    ORDER BY lh."loggedInAt" DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;
