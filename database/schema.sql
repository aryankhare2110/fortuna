--  SECTION 1 : STRONG ENTITIES
CREATE TABLE Player (
    PlayerID BIGSERIAL PRIMARY KEY,
    Username VARCHAR(255) NOT NULL UNIQUE,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50),
    DOB DATE NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHashed VARCHAR(255) NOT NULL,
    WalletBalance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    BlockStatus BOOLEAN NOT NULL DEFAULT FALSE,
    TotalWinnings NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    RewardPoints INT NOT NULL DEFAULT 0,
    GamesPlayed INT NOT NULL DEFAULT 0,

    CONSTRAINT chk_wallet_non_negative CHECK (WalletBalance >= 0),
    CONSTRAINT chk_winnings_non_negative CHECK (TotalWinnings >= 0),
    CONSTRAINT chk_reward_points CHECK (RewardPoints >= 0),
    CONSTRAINT chk_games_played CHECK (GamesPlayed >= 0),
    CONSTRAINT chk_player_age CHECK (CURRENT_DATE - DOB >= INTERVAL '18 years')
);

CREATE TABLE Dealer (
    DealerID BIGSERIAL PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50),
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHashed VARCHAR(255) NOT NULL,
    IsAvailable BOOLEAN NOT NULL DEFAULT TRUE,
    RoundsConducted INT NOT NULL DEFAULT 0,
    TotalBetsHandled INT NOT NULL DEFAULT 0,
    TotalPayouts NUMERIC(12,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT chk_rounds CHECK (RoundsConducted >= 0),
    CONSTRAINT chk_bets CHECK (TotalBetsHandled >= 0),
    CONSTRAINT chk_payouts CHECK (TotalPayouts >= 0)
);

CREATE TABLE Admin (
    AdminID BIGSERIAL PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50),
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHashed VARCHAR(255) NOT NULL
);

CREATE TABLE Game (
    GameID BIGSERIAL PRIMARY KEY,
    GameName VARCHAR(50) NOT NULL UNIQUE,
    MinBet NUMERIC(12,2) NOT NULL,
    MaxBet NUMERIC(12,2) NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_bet_range CHECK (MinBet > 0 AND MaxBet > MinBet)
);

--  SECTION 2 : WEAK ENTITIES & RELATIONSHIP TABLES
CREATE TABLE Game_Session (
    SessionID BIGSERIAL PRIMARY KEY,
    GameID BIGINT NOT NULL,
    DealerID BIGINT NOT NULL,
    StartTime TIMESTAMP NOT NULL DEFAULT NOW(),
    EndTime TIMESTAMP,
    Outcome VARCHAR(50) CHECK (Outcome IN ('player_win','dealer_win','draw','cancelled')),

    CONSTRAINT fk_session_game FOREIGN KEY (GameID) REFERENCES Game(GameID) ON DELETE RESTRICT,
    CONSTRAINT fk_session_dealer FOREIGN KEY (DealerID) REFERENCES Dealer(DealerID) ON DELETE RESTRICT,
    CONSTRAINT chk_session_times CHECK (EndTime IS NULL OR EndTime > StartTime)
);


CREATE TABLE Bet (
    BetTime TIMESTAMP NOT NULL DEFAULT NOW(),
    PlayerID BIGINT NOT NULL,
    SessionID BIGINT NOT NULL,
    Amount NUMERIC(12,2) NOT NULL,
    Result VARCHAR(20) CHECK (Result IN ('win','loss','draw','pending')),
    Payout NUMERIC(12,2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (BetTime, PlayerID, SessionID),

    CONSTRAINT fk_bet_player FOREIGN KEY (PlayerID) REFERENCES Player(PlayerID) ON DELETE CASCADE,
    CONSTRAINT fk_bet_session FOREIGN KEY (SessionID) REFERENCES Game_Session(SessionID) ON DELETE CASCADE,
    CONSTRAINT chk_bet_amount CHECK (Amount > 0),
    CONSTRAINT chk_payout CHECK (Payout >= 0)
);

CREATE TABLE Wallet_Transaction (
    TxnID BIGSERIAL PRIMARY KEY,
    PlayerID BIGINT NOT NULL,
    Type VARCHAR(30) NOT NULL
        CHECK (Type IN ('deposit','withdrawal','bet_debit','bet_credit','reward_redemption')),
    Amount NUMERIC(12,2) NOT NULL,
    TxnTime TIMESTAMP NOT NULL DEFAULT NOW(),
    BalanceAfter NUMERIC(12,2) NOT NULL,
    PointTransaction INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_txn_player FOREIGN KEY (PlayerID) REFERENCES Player(PlayerID) ON DELETE CASCADE,
    CONSTRAINT chk_txn_amount CHECK (Amount > 0),
    CONSTRAINT chk_balance_after CHECK (BalanceAfter >= 0)
);

CREATE TABLE Leaderboard (
    PlayerID BIGINT NOT NULL,
    MetricType VARCHAR(30) NOT NULL
        CHECK (MetricType IN ('total_winnings','net_profit','games_played')),
    Rank INT NOT NULL,

    PRIMARY KEY (PlayerID, MetricType),

    CONSTRAINT fk_lb_player FOREIGN KEY (PlayerID) REFERENCES Player(PlayerID) ON DELETE CASCADE,
    CONSTRAINT chk_rank CHECK (Rank > 0)
);

CREATE TABLE Ban_Log (
    ActionTime TIMESTAMP NOT NULL DEFAULT NOW(),
    DealerID BIGINT NOT NULL,
    PlayerID BIGINT NOT NULL,
    Action VARCHAR(10) NOT NULL CHECK (Action IN ('ban','unban')),
    Reason TEXT,

    PRIMARY KEY (ActionTime, DealerID, PlayerID),

    CONSTRAINT fk_ban_dealer FOREIGN KEY (DealerID) REFERENCES Dealer(DealerID) ON DELETE RESTRICT,
    CONSTRAINT fk_ban_player FOREIGN KEY (PlayerID) REFERENCES Player(PlayerID) ON DELETE CASCADE
);

CREATE TABLE Game_Config_Log (
    ConfigTimestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    GameID BIGINT NOT NULL,
    AdminID BIGINT NOT NULL,
    ChangeDetails JSONB NOT NULL,

    PRIMARY KEY (ConfigTimestamp, GameID, AdminID),

    CONSTRAINT fk_cfg_game FOREIGN KEY (GameID) REFERENCES Game(GameID) ON DELETE CASCADE,
    CONSTRAINT fk_cfg_admin FOREIGN KEY (AdminID) REFERENCES Admin(AdminID) ON DELETE RESTRICT
);


--  SECTION 3 : INDEXES  (speed up common queries)
CREATE INDEX idx_player_email ON Player(Email);
CREATE INDEX idx_player_blockstatus ON Player(BlockStatus);
CREATE INDEX idx_bet_playerid ON Bet(PlayerID);
CREATE INDEX idx_bet_sessionid ON Bet(SessionID);
CREATE INDEX idx_session_gameid ON Game_Session(GameID);
CREATE INDEX idx_session_dealerid ON Game_Session(DealerID);
CREATE INDEX idx_txn_playerid ON Wallet_Transaction(PlayerID);
CREATE INDEX idx_txn_time ON Wallet_Transaction(TxnTime DESC);
CREATE INDEX idx_lb_metric_rank ON Leaderboard(MetricType, Rank);
CREATE INDEX idx_ban_playerid ON Ban_Log(PlayerID);
CREATE INDEX idx_ban_dealerid ON Ban_Log(DealerID);

--  SECTION 4 : TRIGGERS
--  TRIGGER 1: Enforce bet amount is within game min/max limits
CREATE OR REPLACE FUNCTION fn_check_bet_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_min NUMERIC(12,2);
    v_max NUMERIC(12,2);
    v_game_id BIGINT;
BEGIN
    SELECT GameID INTO v_game_id
    FROM Game_Session
    WHERE SessionID = NEW.SessionID;

    SELECT MinBet, MaxBet INTO v_min, v_max
    FROM Game
    WHERE GameID = v_game_id;

    IF NEW.Amount < v_min OR NEW.Amount > v_max THEN
        RAISE EXCEPTION
            'Bet amount % is outside game limits (min: %, max: %)',
            NEW.Amount, v_min, v_max;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bet_limits
BEFORE INSERT ON Bet
FOR EACH ROW EXECUTE FUNCTION fn_check_bet_limits();

--  TRIGGER 2: After a bet resolves, update Player stats (TotalWinnings, GamesPlayed, RewardPoints)
CREATE OR REPLACE FUNCTION fn_update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Result IN ('win','loss','draw') AND
       (OLD.Result IS NULL OR OLD.Result = 'pending') THEN

        UPDATE Player
        SET
            TotalWinnings = TotalWinnings + CASE WHEN NEW.Result = 'win' THEN NEW.Payout ELSE 0 END,
            GamesPlayed = GamesPlayed + 1,
            RewardPoints = RewardPoints + FLOOR(NEW.Amount)::INT
                + CASE WHEN NEW.Result = 'win' THEN 5 ELSE 0 END
        WHERE PlayerID = NEW.PlayerID;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_player_stats
AFTER UPDATE ON Bet
FOR EACH ROW EXECUTE FUNCTION fn_update_player_stats();

--  TRIGGER 3: After a bet resolves, update Dealer stats
CREATE OR REPLACE FUNCTION fn_update_dealer_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_dealer_id BIGINT;
BEGIN
    IF NEW.Result IN ('win','loss','draw') AND
       (OLD.Result IS NULL OR OLD.Result = 'pending') THEN

        SELECT DealerID INTO v_dealer_id
        FROM Game_Session
        WHERE SessionID = NEW.SessionID;

        UPDATE Dealer
        SET
            TotalBetsHandled = TotalBetsHandled + 1,
            TotalPayouts = TotalPayouts + NEW.Payout
        WHERE DealerID = v_dealer_id;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_dealer_stats
AFTER UPDATE ON Bet
FOR EACH ROW EXECUTE FUNCTION fn_update_dealer_stats();


--  TRIGGER 4: When a session ends, increment Dealer rounds
CREATE OR REPLACE FUNCTION fn_increment_dealer_rounds()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.EndTime IS NOT NULL AND OLD.EndTime IS NULL THEN
        UPDATE Dealer
        SET RoundsConducted = RoundsConducted + 1
        WHERE DealerID = NEW.DealerID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dealer_rounds
AFTER UPDATE ON Game_Session
FOR EACH ROW EXECUTE FUNCTION fn_increment_dealer_rounds();


--  TRIGGER 5: Enforce BlockStatus — blocked players cannot bet
CREATE OR REPLACE FUNCTION fn_block_check()
RETURNS TRIGGER AS $$
DECLARE
    v_blocked BOOLEAN;
BEGIN
    SELECT BlockStatus INTO v_blocked
    FROM Player
    WHERE PlayerID = NEW.PlayerID;

    IF v_blocked THEN
        RAISE EXCEPTION 'Player % is blocked and cannot place bets.', NEW.PlayerID;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_check
BEFORE INSERT ON Bet
FOR EACH ROW EXECUTE FUNCTION fn_block_check();

--  TRIGGER 6: Deduct wallet balance when a bet is placed; credit it back on a win
CREATE OR REPLACE FUNCTION fn_wallet_bet_debit()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Player
    SET WalletBalance = WalletBalance - NEW.Amount
    WHERE PlayerID = NEW.PlayerID;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_bet_debit
AFTER INSERT ON Bet
FOR EACH ROW EXECUTE FUNCTION fn_wallet_bet_debit();

CREATE OR REPLACE FUNCTION fn_wallet_bet_credit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Result IN ('win', 'draw') AND
       (OLD.Result IS NULL OR OLD.Result = 'pending') THEN

        UPDATE Player
        SET WalletBalance = WalletBalance + NEW.Payout
        WHERE PlayerID = NEW.PlayerID;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_bet_credit
AFTER UPDATE ON Bet
FOR EACH ROW EXECUTE FUNCTION fn_wallet_bet_credit();


--  SECTION 5 : LEADERBOARD REFRESH FUNCTION - Call this after each game round:  SELECT refresh_leaderboard();

CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS VOID AS $$
BEGIN
    DELETE FROM Leaderboard;

    INSERT INTO Leaderboard (PlayerID, MetricType, Rank)
    SELECT
        PlayerID,
        'total_winnings',
        RANK() OVER (ORDER BY TotalWinnings DESC)
    FROM Player
    WHERE BlockStatus = FALSE;

    INSERT INTO Leaderboard (PlayerID, MetricType, Rank)
    SELECT
        p.PlayerID,
        'net_profit',
        RANK() OVER (ORDER BY (p.TotalWinnings - COALESCE(SUM(b.Amount), 0)) DESC)
    FROM Player p
    LEFT JOIN Bet b ON b.PlayerID = p.PlayerID
    WHERE p.BlockStatus = FALSE
    GROUP BY p.PlayerID, p.TotalWinnings;

    INSERT INTO Leaderboard (PlayerID, MetricType, Rank)
    SELECT
        PlayerID,
        'games_played',
        RANK() OVER (ORDER BY GamesPlayed DESC)
    FROM Player
    WHERE BlockStatus = FALSE;

END;
$$ LANGUAGE plpgsql;