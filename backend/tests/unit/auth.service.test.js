/**
 * Tests Unitaires - AuthService
 * @description Tests du service d'authentification (inscription, connexion, JWT)
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock des dépendances AVANT d'importer le service
jest.mock('../../src/repositories/user.repository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Import après les mocks
const authService = require('../../src/services/auth.service');
const userRepository = require('../../src/repositories/user.repository');
const { ApiError } = require('../../src/middlewares/errorHandler');

describe('AuthService', () => {
  // =============================================
  // SETUP & TEARDOWN
  // =============================================
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================
  // TESTS: INSCRIPTION (register)
  // =============================================
  describe('register()', () => {
    const validRegistrationData = {
      email: 'nouveau@example.com',
      motDePasse: 'SecureP@ss123',
      nom: 'Nouveau',
      prenom: 'Client',
      telephone: '0698765432',
      typeClient: 'PARTICULIER',
      accepteCgu: true,
      accepteNewsletter: false
    };

    it('devrait créer un utilisateur avec succès', async () => {
      // Arrange
      const hashedPassword = '$2b$12$hashedpassword';
      const createdUser = {
        id: 'uuid-123',
        email: validRegistrationData.email,
        nom: validRegistrationData.nom,
        prenom: validRegistrationData.prenom,
        role: 'CLIENT',
        typeClient: 'PARTICULIER',
        estActif: true
      };
      const token = 'jwt-token-123';

      userRepository.emailExists.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      userRepository.create.mockResolvedValue(createdUser);
      jwt.sign.mockReturnValue(token);

      // Act
      const result = await authService.register(validRegistrationData);

      // Assert
      expect(userRepository.emailExists).toHaveBeenCalledWith(validRegistrationData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(validRegistrationData.motDePasse, expect.any(Number));
      expect(userRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', token);
      expect(result.user.email).toBe(validRegistrationData.email);
    });

    it('devrait rejeter si l\'email existe déjà', async () => {
      // Arrange
      userRepository.emailExists.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.register(validRegistrationData))
        .rejects
        .toThrow('Cette adresse email est déjà utilisée');

      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('devrait rejeter si CGU non acceptées', async () => {
      // Arrange
      const dataWithoutCgu = { ...validRegistrationData, accepteCgu: false };
      userRepository.emailExists.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.register(dataWithoutCgu))
        .rejects
        .toThrow('Vous devez accepter les conditions générales');
    });

    it('devrait exiger le SIRET pour les professionnels', async () => {
      // Arrange
      const proDataWithoutSiret = {
        ...validRegistrationData,
        typeClient: 'PROFESSIONNEL',
        siret: null,
        raisonSociale: 'Mon Entreprise'
      };
      userRepository.emailExists.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.register(proDataWithoutSiret))
        .rejects
        .toThrow('SIRET est obligatoire');
    });

    it('devrait exiger un SIRET de 14 chiffres', async () => {
      // Arrange
      const proDataInvalidSiret = {
        ...validRegistrationData,
        typeClient: 'PROFESSIONNEL',
        siret: '12345', // Trop court
        raisonSociale: 'Mon Entreprise'
      };
      userRepository.emailExists.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.register(proDataInvalidSiret))
        .rejects
        .toThrow('SIRET');
    });

    it('devrait exiger la raison sociale pour les professionnels', async () => {
      // Arrange
      const proDataWithoutRaisonSociale = {
        ...validRegistrationData,
        typeClient: 'PROFESSIONNEL',
        siret: '12345678901234',
        raisonSociale: null
      };
      userRepository.emailExists.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.register(proDataWithoutRaisonSociale))
        .rejects
        .toThrow('raison sociale est obligatoire');
    });

    it('devrait normaliser l\'email en minuscules', async () => {
      // Arrange
      const dataWithUpperEmail = {
        ...validRegistrationData,
        email: 'TEST@EXAMPLE.COM'
      };
      userRepository.emailExists.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.create.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'CLIENT'
      });
      jwt.sign.mockReturnValue('token');

      // Act
      await authService.register(dataWithUpperEmail);

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com'
        })
      );
    });
  });

  // =============================================
  // TESTS: CONNEXION (login)
  // =============================================
  describe('login()', () => {
    const validCredentials = {
      email: 'test@example.com',
      motDePasse: 'SecureP@ss123'
    };

    const existingUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      motDePasseHash: '$2b$12$hashedpassword',
      nom: 'Test',
      prenom: 'User',
      role: 'CLIENT',
      typeClient: 'PARTICULIER',
      estActif: true
    };

    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      // Arrange
      const token = 'jwt-token-123';
      userRepository.findByEmail.mockResolvedValue(existingUser);
      bcrypt.compare.mockResolvedValue(true);
      userRepository.updateLastLogin.mockResolvedValue();
      jwt.sign.mockReturnValue(token);

      // Act
      const result = await authService.login(validCredentials.email, validCredentials.motDePasse);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(validCredentials.motDePasse, existingUser.motDePasseHash);
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(existingUser.id);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', token);
      expect(result.user).not.toHaveProperty('motDePasseHash'); // Doit être sanitized
    });

    it('devrait rejeter si l\'utilisateur n\'existe pas', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login('inexistant@example.com', 'password'))
        .rejects
        .toThrow('Email ou mot de passe incorrect');
    });

    it('devrait rejeter si le mot de passe est incorrect', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(existingUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(validCredentials.email, 'wrongpassword'))
        .rejects
        .toThrow('Email ou mot de passe incorrect');
    });

    it('devrait rejeter si le compte est désactivé', async () => {
      // Arrange
      const inactiveUser = { ...existingUser, estActif: false };
      userRepository.findByEmail.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.login(validCredentials.email, validCredentials.motDePasse))
        .rejects
        .toThrow('compte a été désactivé');
    });

    it('devrait normaliser l\'email en minuscules lors de la connexion', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(existingUser);
      bcrypt.compare.mockResolvedValue(true);
      userRepository.updateLastLogin.mockResolvedValue();
      jwt.sign.mockReturnValue('token');

      // Act
      await authService.login('TEST@EXAMPLE.COM', validCredentials.motDePasse);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  // =============================================
  // TESTS: PROFIL (getProfile)
  // =============================================
  describe('getProfile()', () => {
    it('devrait retourner le profil de l\'utilisateur', async () => {
      // Arrange
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        motDePasseHash: 'hash',
        nom: 'Test',
        prenom: 'User',
        estActif: true
      };
      userRepository.findById.mockResolvedValue(user);

      // Act
      const result = await authService.getProfile('uuid-123');

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith('uuid-123');
      expect(result).not.toHaveProperty('motDePasseHash');
      expect(result.email).toBe('test@example.com');
    });

    it('devrait rejeter si l\'utilisateur n\'existe pas', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getProfile('uuid-inexistant'))
        .rejects
        .toThrow('Utilisateur non trouvé');
    });

    it('devrait rejeter si le compte est désactivé', async () => {
      // Arrange
      const inactiveUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        estActif: false
      };
      userRepository.findById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.getProfile('uuid-123'))
        .rejects
        .toThrow('compte a été désactivé');
    });
  });

  // =============================================
  // TESTS: GÉNÉRATION TOKEN (generateToken)
  // =============================================
  describe('generateToken()', () => {
    it('devrait générer un token JWT valide', () => {
      // Arrange
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'CLIENT',
        typeClient: 'PARTICULIER'
      };
      const expectedToken = 'generated-jwt-token';
      jwt.sign.mockReturnValue(expectedToken);

      // Act
      const token = authService.generateToken(user);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          typeClient: user.typeClient
        },
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe(expectedToken);
    });
  });

  // =============================================
  // TESTS: VÉRIFICATION TOKEN (verifyToken)
  // =============================================
  describe('verifyToken()', () => {
    it('devrait vérifier et décoder un token valide', () => {
      // Arrange
      const payload = { id: 'uuid-123', email: 'test@example.com', role: 'CLIENT' };
      jwt.verify.mockReturnValue(payload);

      // Act
      const result = authService.verifyToken('valid-token');

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(result).toEqual(payload);
    });

    it('devrait rejeter un token expiré', () => {
      // Arrange
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => { throw expiredError; });

      // Act & Assert
      expect(() => authService.verifyToken('expired-token'))
        .toThrow('Token expiré');
    });

    it('devrait rejeter un token invalide', () => {
      // Arrange
      const invalidError = new Error('invalid token');
      invalidError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => { throw invalidError; });

      // Act & Assert
      expect(() => authService.verifyToken('invalid-token'))
        .toThrow('Token invalide');
    });
  });

  // =============================================
  // TESTS: SANITIZE USER
  // =============================================
  describe('sanitizeUser()', () => {
    it('devrait retirer le hash du mot de passe', () => {
      // Arrange
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        motDePasseHash: '$2b$12$secret-hash',
        nom: 'Test',
        prenom: 'User'
      };

      // Act
      const sanitized = authService.sanitizeUser(user);

      // Assert
      expect(sanitized).not.toHaveProperty('motDePasseHash');
      expect(sanitized.id).toBe(user.id);
      expect(sanitized.email).toBe(user.email);
      expect(sanitized.nom).toBe(user.nom);
    });
  });

  // =============================================
  // TESTS: CHANGEMENT MOT DE PASSE
  // =============================================
  describe('changePassword()', () => {
    it('devrait changer le mot de passe avec l\'ancien valide', async () => {
      // Arrange
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        motDePasseHash: '$2b$12$oldhash'
      };
      userRepository.findById.mockResolvedValue(user);
      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('$2b$12$newhash');
      userRepository.updatePassword.mockResolvedValue();

      // Act
      await authService.changePassword('uuid-123', 'oldPassword', 'newPassword');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword', user.motDePasseHash);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', expect.any(Number));
      expect(userRepository.updatePassword).toHaveBeenCalledWith('uuid-123', '$2b$12$newhash');
    });

    it('devrait rejeter si l\'ancien mot de passe est incorrect', async () => {
      // Arrange
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        motDePasseHash: '$2b$12$oldhash'
      };
      userRepository.findById.mockResolvedValue(user);
      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.changePassword('uuid-123', 'wrongOldPassword', 'newPassword'))
        .rejects
        .toThrow('ancien mot de passe est incorrect');
    });
  });
});
