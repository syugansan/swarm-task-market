-- Database function to update user balance safely
CREATE OR REPLACE FUNCTION update_user_balance(user_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;