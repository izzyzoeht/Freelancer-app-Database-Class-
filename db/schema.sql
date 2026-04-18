DROP DATABASE IF EXISTS freelancer_db;
CREATE DATABASE freelancer_db;
USE freelancer_db;

-- =============================================
-- 1. USERS
-- This table stores all users of the system.
-- It includes employers, tradespeople, and juniors.
-- It also stores login information using email and password_hash.
-- =============================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(20),
    user_type ENUM('Employer', 'Tradesperson', 'Junior') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. TRADESPEOPLE
-- This table stores additional information for tradespeople.
-- If endorse_id is NULL, the user is a main tradesperson.
-- If endorse_id is NOT NULL, the user is a junior/apprentice
-- working under a supervising tradesperson.
-- =============================================
CREATE TABLE tradespeople (
    tradesperson_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    trade_category VARCHAR(100) NOT NULL,
    license_number VARCHAR(100),
    license_state VARCHAR(50),
    license_expiry DATE,
    experience_year INT NOT NULL,
    endorse_id INT NULL,
    job_limit INT DEFAULT 5,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (endorse_id) REFERENCES tradespeople(tradesperson_id) ON DELETE SET NULL
);

-- =============================================
-- 3. SERVICES
-- This table stores services offered by tradespeople.
-- Each service belongs to one tradesperson.
-- =============================================
CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    tradesperson_id INT NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    description TEXT,
    hourly_rate DECIMAL(10,2),
    trade_type VARCHAR(100),
    FOREIGN KEY (tradesperson_id) REFERENCES tradespeople(tradesperson_id) ON DELETE CASCADE
);

-- =============================================
-- 4. BOOKINGS
-- This table represents jobs booked by employers.
-- user_id = employer who requested the job
-- tradesperson_id = main tradesperson assigned to the job
-- Status flow: pending → accepted → in_progress → completed
-- =============================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tradesperson_id INT NOT NULL,
    service_id INT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled') NOT NULL,
    city VARCHAR(100),
    address VARCHAR(255),
    quoted_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (tradesperson_id) REFERENCES tradespeople(tradesperson_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

-- =============================================
-- 5. PAYMENTS
-- This table stores payment details for each booking.
-- Each payment is linked to a booking.
-- =============================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('card', 'cash', 'online') NOT NULL,
    status ENUM('pending', 'paid', 'failed') NOT NULL,
    paid_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- =============================================
-- 6. REVIEW REQUESTS
-- This table is automatically created when a booking is completed.
-- It ensures only the employer of that booking can submit a review.
-- One request per booking.
-- =============================================
CREATE TABLE review_requests (
    review_request_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    employer_id INT NOT NULL,
    tradesperson_id INT NOT NULL,
    status ENUM('pending', 'submitted') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (employer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (tradesperson_id) REFERENCES tradespeople(tradesperson_id) ON DELETE CASCADE
);

-- =============================================
-- 7. REVIEWS
-- This table stores reviews submitted by employers.
-- Each booking can have only one review.
-- Reviews are only for the main tradesperson.
-- =============================================
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    reviewer_user_id INT NOT NULL,
    tradesperson_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (tradesperson_id) REFERENCES tradespeople(tradesperson_id) ON DELETE CASCADE,
    CHECK (rating BETWEEN 1 AND 5)
);

-- =============================================
-- 8. INDEXES
-- Improve performance for common queries
-- =============================================
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_tradesperson ON bookings(tradesperson_id);
CREATE INDEX idx_services_trade ON services(trade_type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_review_requests_status ON review_requests(status);

-- =============================================
-- TRIGGER 1
-- Prevent junior/apprentice from booking jobs alone
-- If endorse_id is NOT NULL → junior → block booking
-- =============================================
DELIMITER $$

CREATE TRIGGER prevent_junior_booking
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    DECLARE supervisor_id INT;

    SELECT endorse_id
    INTO supervisor_id
    FROM tradespeople
    WHERE tradesperson_id = NEW.tradesperson_id;

    IF supervisor_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Junior/apprentice cannot book a job without a supervisor';
    END IF;
END$$

DELIMITER ;

-- =============================================
-- TRIGGER 2
-- Prevent updating booking to a junior tradesperson
-- =============================================
DELIMITER $$

CREATE TRIGGER prevent_junior_booking_update
BEFORE UPDATE ON bookings
FOR EACH ROW
BEGIN
    DECLARE supervisor_id INT;

    SELECT endorse_id
    INTO supervisor_id
    FROM tradespeople
    WHERE tradesperson_id = NEW.tradesperson_id;

    IF supervisor_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Junior/apprentice cannot book a job without a supervisor';
    END IF;
END$$



DELIMITER ;
