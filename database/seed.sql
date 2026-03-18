
SET session_replication_role = 'replica';


--  ADMINS  (3)
INSERT INTO Admin (FirstName, LastName, Email, PasswordHashed) VALUES
('Rohan',   'Mehta',   'rohan.admin@fortuna.com',  '$2b$12$admin_hash_001'),
('Priya',   'Sharma',  'priya.admin@fortuna.com',  '$2b$12$admin_hash_002'),
('Vikram',  'Nair',    'vikram.admin@fortuna.com', '$2b$12$admin_hash_003');



--  DEALERS  (4)
INSERT INTO Dealer (FirstName, LastName, Email, PasswordHashed, IsAvailable,
                    RoundsConducted, TotalBetsHandled, TotalPayouts) VALUES
('Amit',    'Kapoor',  'amit.dealer@fortuna.com',   '$2b$12$dealer_hash_001', TRUE,  28, 42, 18500.00),
('Sneha',   'Rao',     'sneha.dealer@fortuna.com',  '$2b$12$dealer_hash_002', TRUE,  22, 35, 14200.00),
('Karan',   'Singh',   'karan.dealer@fortuna.com',  '$2b$12$dealer_hash_003', FALSE, 15, 20,  8750.00),
('Divya',   'Iyer',    'divya.dealer@fortuna.com',  '$2b$12$dealer_hash_004', TRUE,  19, 30, 12300.00);


--  GAMES  (3)
INSERT INTO Game (GameName, MinBet, MaxBet, IsActive) VALUES
('Blackjack',  50.00, 5000.00, TRUE),
('Roulette',   25.00, 2500.00, TRUE),
('Coin Toss',  10.00, 1000.00, TRUE);


--  PLAYERS  (15)
--  Passwords are bcrypt hashes of 'Password@123'
INSERT INTO Player (
    Username, FirstName, LastName, DOB, Email,
    PasswordHashed, WalletBalance, BlockStatus,
    TotalWinnings, RewardPoints, GamesPlayed
) VALUES
('ace_aryan',    'Aryan',    'Khare',    '1999-04-12', 'aryan@players.com',    '$2b$12$player_hash_001', 12500.00, FALSE,  8200.00, 340, 22),
('akash_bet',    'Akash',    'Adur',     '1998-07-23', 'akash@players.com',    '$2b$12$player_hash_002',  9800.00, FALSE,  6100.00, 270, 18),
('pranshu_p',    'Pranshu',  'Prakash',  '2000-01-05', 'pranshu@players.com',  '$2b$12$player_hash_003', 15200.00, FALSE, 11300.00, 480, 30),
('lucky_lena',   'Lena',     'D''Souza', '1995-09-17', 'lena@players.com',     '$2b$12$player_hash_004',  3200.00, FALSE,  2800.00, 120, 10),
('high_roller',  'Rahul',    'Gupta',    '1990-03-28', 'rahul@players.com',    '$2b$12$player_hash_005', 45000.00, FALSE, 32000.00, 900, 55),
('sneaky_sam',   'Sameer',   'Khan',     '1997-11-02', 'sameer@players.com',   '$2b$12$player_hash_006',   500.00, TRUE,   1200.00,  45,  8),
('royal_riya',   'Riya',     'Patel',    '2001-06-14', 'riya@players.com',     '$2b$12$player_hash_007',  7600.00, FALSE,  5400.00, 230, 16),
('bluff_master', 'Nikhil',   'Joshi',    '1993-12-30', 'nikhil@players.com',   '$2b$12$player_hash_008', 22000.00, FALSE, 18700.00, 710, 42),
('dice_queen',   'Kavya',    'Menon',    '1996-08-08', 'kavya@players.com',    '$2b$12$player_hash_009',  6300.00, FALSE,  4900.00, 195, 14),
('all_in_anuj',  'Anuj',     'Verma',    '1994-02-19', 'anuj@players.com',     '$2b$12$player_hash_010',  1100.00, FALSE,   900.00,  38,  7),
('sharp_shruti', 'Shruti',   'Bose',     '1999-10-25', 'shruti@players.com',   '$2b$12$player_hash_011', 18400.00, FALSE, 14200.00, 590, 35),
('wild_waqar',   'Waqar',    'Siddiqui', '1992-05-11', 'waqar@players.com',    '$2b$12$player_hash_012',  4700.00, FALSE,  3600.00, 155, 12),
('zen_zara',     'Zara',     'Mirza',    '2000-03-07', 'zara@players.com',     '$2b$12$player_hash_013',  8900.00, FALSE,  7100.00, 300, 20),
('lucky_laxmi',  'Laxmi',    'Reddy',    '1991-07-16', 'laxmi@players.com',    '$2b$12$player_hash_014', 11200.00, FALSE,  9500.00, 395, 26),
('fast_farhan',  'Farhan',   'Sheikh',   '1997-04-03', 'farhan@players.com',   '$2b$12$player_hash_015',  2800.00, FALSE,  1900.00,  80,  9);


--  GAME SESSIONS  (12 sessions across 3 games, 4 dealers)
--  GameID: 1=Blackjack, 2=Roulette, 3=Coin Toss
--  DealerID: 1=Amit, 2=Sneha, 3=Karan, 4=Divya
INSERT INTO Game_Session (GameID, DealerID, StartTime, EndTime, Outcome) VALUES
(1, 1, '2026-01-10 14:00:00', '2026-01-10 15:30:00', 'player_win'),  -- S1
(1, 2, '2026-01-11 16:00:00', '2026-01-11 17:15:00', 'dealer_win'),  -- S2
(2, 1, '2026-01-12 10:00:00', '2026-01-12 11:00:00', 'player_win'),  -- S3
(2, 4, '2026-01-13 13:00:00', '2026-01-13 14:30:00', 'draw'),        -- S4
(3, 3, '2026-01-14 09:00:00', '2026-01-14 09:45:00', 'player_win'),  -- S5
(3, 2, '2026-01-15 18:00:00', '2026-01-15 18:30:00', 'dealer_win'),  -- S6
(1, 4, '2026-01-16 20:00:00', '2026-01-16 21:30:00', 'player_win'),  -- S7
(2, 1, '2026-01-17 11:00:00', '2026-01-17 12:15:00', 'dealer_win'),  -- S8
(3, 4, '2026-01-18 15:00:00', '2026-01-18 15:40:00', 'player_win'),  -- S9
(1, 2, '2026-01-19 17:00:00', '2026-01-19 18:45:00', 'draw'),        -- S10
(2, 3, '2026-01-20 09:30:00', '2026-01-20 10:30:00', 'player_win'),  -- S11
(3, 1, '2026-01-21 14:00:00', '2026-01-21 14:30:00', 'dealer_win');  -- S12


--  BETS  (~80 bets spread across sessions and players)
--  Format: (BetTime, PlayerID, SessionID, Amount, Result, Payout)

-- Session 1 : Blackjack, Amit, player_win
INSERT INTO Bet VALUES
('2026-01-10 14:05:00',  1, 1,  500.00, 'win',  1000.00),
('2026-01-10 14:20:00',  2, 1,  300.00, 'loss',    0.00),
('2026-01-10 14:35:00',  5, 1, 2000.00, 'win',  4000.00),
('2026-01-10 14:50:00',  8, 1, 1500.00, 'win',  3000.00),
('2026-01-10 15:10:00', 11, 1,  800.00, 'loss',    0.00),
('2026-01-10 15:20:00', 13, 1,  600.00, 'win',  1200.00);

-- Session 2 : Blackjack, Sneha, dealer_win
INSERT INTO Bet VALUES
('2026-01-11 16:05:00',  3, 2,  700.00, 'loss',    0.00),
('2026-01-11 16:20:00',  4, 2,  200.00, 'loss',    0.00),
('2026-01-11 16:35:00',  7, 2,  400.00, 'loss',    0.00),
('2026-01-11 16:50:00',  9, 2,  350.00, 'loss',    0.00),
('2026-01-11 17:00:00', 12, 2,  500.00, 'loss',    0.00),
('2026-01-11 17:10:00', 15, 2,  150.00, 'loss',    0.00);

-- Session 3 : Roulette, Amit, player_win
INSERT INTO Bet VALUES
('2026-01-12 10:05:00',  1, 3,  250.00, 'win',   500.00),
('2026-01-12 10:20:00',  5, 3, 1000.00, 'win',  2000.00),
('2026-01-12 10:35:00',  8, 3,  750.00, 'win',  1500.00),
('2026-01-12 10:45:00', 10, 3,  100.00, 'loss',    0.00),
('2026-01-12 10:55:00', 14, 3,  500.00, 'win',  1000.00);

-- Session 4 : Roulette, Divya, draw
INSERT INTO Bet VALUES
('2026-01-13 13:05:00',  2, 4,  400.00, 'draw',  400.00),
('2026-01-13 13:20:00',  6, 4,   75.00, 'draw',   75.00),
('2026-01-13 13:35:00',  9, 4,  200.00, 'draw',  200.00),
('2026-01-13 13:50:00', 11, 4,  600.00, 'draw',  600.00),
('2026-01-13 14:10:00', 13, 4,  300.00, 'draw',  300.00);

-- Session 5 : Coin Toss, Karan, player_win
INSERT INTO Bet VALUES
('2026-01-14 09:05:00',  3, 5,  500.00, 'win',  1000.00),
('2026-01-14 09:10:00',  7, 5,  200.00, 'win',   400.00),
('2026-01-14 09:15:00', 10, 5,  100.00, 'win',   200.00),
('2026-01-14 09:20:00', 12, 5,  300.00, 'loss',    0.00),
('2026-01-14 09:30:00', 14, 5,  150.00, 'win',   300.00),
('2026-01-14 09:40:00', 15, 5,   50.00, 'loss',    0.00);

-- Session 6 : Coin Toss, Sneha, dealer_win
INSERT INTO Bet VALUES
('2026-01-15 18:05:00',  1, 6,  200.00, 'loss',    0.00),
('2026-01-15 18:10:00',  4, 6,  100.00, 'loss',    0.00),
('2026-01-15 18:15:00',  8, 6,  500.00, 'loss',    0.00),
('2026-01-15 18:20:00', 11, 6,  300.00, 'loss',    0.00),
('2026-01-15 18:25:00', 13, 6,  150.00, 'loss',    0.00);

-- Session 7 : Blackjack, Divya, player_win
INSERT INTO Bet VALUES
('2026-01-16 20:05:00',  5, 7, 3000.00, 'win',  6000.00),
('2026-01-16 20:20:00',  8, 7, 2000.00, 'win',  4000.00),
('2026-01-16 20:35:00', 11, 7, 1000.00, 'win',  2000.00),
('2026-01-16 20:50:00', 14, 7,  500.00, 'loss',    0.00),
('2026-01-16 21:05:00',  3, 7,  800.00, 'win',  1600.00),
('2026-01-16 21:20:00',  2, 7,  600.00, 'loss',    0.00);

-- Session 8 : Roulette, Amit, dealer_win
INSERT INTO Bet VALUES
('2026-01-17 11:05:00',  7, 8,  500.00, 'loss',    0.00),
('2026-01-17 11:20:00',  9, 8,  250.00, 'loss',    0.00),
('2026-01-17 11:35:00', 12, 8,  400.00, 'loss',    0.00),
('2026-01-17 11:50:00', 15, 8,  100.00, 'loss',    0.00),
('2026-01-17 12:00:00',  4, 8,  200.00, 'loss',    0.00);

-- Session 9 : Coin Toss, Divya, player_win
INSERT INTO Bet VALUES
('2026-01-18 15:05:00',  1, 9,  300.00, 'win',   600.00),
('2026-01-18 15:10:00',  6, 9,   50.00, 'win',   100.00),
('2026-01-18 15:15:00', 10, 9,  200.00, 'win',   400.00),
('2026-01-18 15:20:00', 13, 9,  400.00, 'win',   800.00),
('2026-01-18 15:30:00',  3, 9,  600.00, 'loss',    0.00);

-- Session 10 : Blackjack, Sneha, draw
INSERT INTO Bet VALUES
('2026-01-19 17:05:00',  5, 10, 1000.00, 'draw', 1000.00),
('2026-01-19 17:20:00',  8, 10, 1500.00, 'draw', 1500.00),
('2026-01-19 17:35:00', 11, 10,  700.00, 'draw',  700.00),
('2026-01-19 17:50:00', 14, 10,  300.00, 'draw',  300.00),
('2026-01-19 18:10:00',  2, 10,  500.00, 'draw',  500.00),
('2026-01-19 18:30:00',  9, 10,  200.00, 'draw',  200.00);

-- Session 11 : Roulette, Karan, player_win
INSERT INTO Bet VALUES
('2026-01-20 09:35:00',  7, 11,  750.00, 'win',  1500.00),
('2026-01-20 09:45:00', 12, 11,  500.00, 'win',  1000.00),
('2026-01-20 09:55:00', 15, 11,  200.00, 'win',   400.00),
('2026-01-20 10:05:00',  4, 11,  300.00, 'loss',    0.00),
('2026-01-20 10:15:00', 10, 11,  150.00, 'win',   300.00),
('2026-01-20 10:25:00',  6, 11,   75.00, 'loss',    0.00);

-- Session 12 : Coin Toss, Amit, dealer_win
INSERT INTO Bet VALUES
('2026-01-21 14:05:00',  1, 12,  500.00, 'loss',    0.00),
('2026-01-21 14:10:00',  3, 12,  300.00, 'loss',    0.00),
('2026-01-21 14:15:00',  5, 12,  800.00, 'loss',    0.00),
('2026-01-21 14:20:00',  8, 12,  600.00, 'loss',    0.00),
('2026-01-21 14:25:00', 11, 12,  400.00, 'loss',    0.00);



--  WALLET TRANSACTIONS  (deposits + sample bet records)
INSERT INTO Wallet_Transaction (PlayerID, Type, Amount, TxnTime, BalanceAfter, PointTransaction) VALUES
( 1, 'deposit',    20000.00, '2026-01-01 10:00:00', 20000.00,   0),
( 2, 'deposit',    15000.00, '2026-01-01 10:05:00', 15000.00,   0),
( 3, 'deposit',    25000.00, '2026-01-01 10:10:00', 25000.00,   0),
( 4, 'deposit',     5000.00, '2026-01-01 10:15:00',  5000.00,   0),
( 5, 'deposit',    80000.00, '2026-01-01 10:20:00', 80000.00,   0),
( 6, 'deposit',     3000.00, '2026-01-01 10:25:00',  3000.00,   0),
( 7, 'deposit',    12000.00, '2026-01-01 10:30:00', 12000.00,   0),
( 8, 'deposit',    35000.00, '2026-01-01 10:35:00', 35000.00,   0),
( 9, 'deposit',    10000.00, '2026-01-01 10:40:00', 10000.00,   0),
(10, 'deposit',     2000.00, '2026-01-01 10:45:00',  2000.00,   0),
(11, 'deposit',    30000.00, '2026-01-01 10:50:00', 30000.00,   0),
(12, 'deposit',     8000.00, '2026-01-01 10:55:00',  8000.00,   0),
(13, 'deposit',    15000.00, '2026-01-01 11:00:00', 15000.00,   0),
(14, 'deposit',    20000.00, '2026-01-01 11:05:00', 20000.00,   0),
(15, 'deposit',     5000.00, '2026-01-01 11:10:00',  5000.00,   0),
-- Reward redemption example
( 5, 'reward_redemption', 500.00, '2026-01-09 12:00:00', 80500.00, -100),
( 8, 'reward_redemption', 250.00, '2026-01-09 12:30:00', 35250.00,  -50),
-- Withdrawal examples
( 5, 'withdrawal', 10000.00, '2026-01-22 09:00:00', 45000.00,  0),
(11, 'withdrawal',  5000.00, '2026-01-22 09:30:00', 18400.00,  0);


--  BAN LOG  (sneaky_sam was banned by dealer Amit)
INSERT INTO Ban_Log (ActionTime, DealerID, PlayerID, Action, Reason) VALUES
('2026-01-13 16:00:00', 1, 6, 'ban',
 'Suspicious betting pattern — rapid repeated minimum bets across sessions');


--  GAME CONFIG LOG  (admin updated Blackjack limits)
INSERT INTO Game_Config_Log (ConfigTimestamp, GameID, AdminID, ChangeDetails) VALUES
('2026-01-05 09:00:00', 1, 1,
 '{"field": "MaxBet", "old_value": 2000, "new_value": 5000, "reason": "High-roller demand"}'),
('2026-01-08 11:00:00', 3, 2,
 '{"field": "MinBet", "old_value": 25, "new_value": 10, "reason": "Increase accessibility"}');


-- Re-enable triggers
SET session_replication_role = 'origin';

-- Refresh leaderboard with the seeded data
SELECT refresh_leaderboard();