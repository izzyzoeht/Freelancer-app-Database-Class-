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
