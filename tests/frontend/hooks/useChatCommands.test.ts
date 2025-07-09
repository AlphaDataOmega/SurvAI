/**
 * @fileoverview Unit tests for useChatCommands hook
 * 
 * Tests for command parsing, execution, and error handling
 * following existing test patterns from the codebase.
 */

import { renderHook, act } from '@testing-library/react';
import { useChatCommands } from '../../../frontend/src/hooks/useChatCommands';
import { useAuth } from '../../../frontend/src/hooks/useAuth';
import { offerApi } from '../../../frontend/src/services/offer';
import type { User } from '@survai/shared';

// Mock dependencies
jest.mock('../../../frontend/src/hooks/useAuth');
jest.mock('../../../frontend/src/services/offer');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedOfferApi = offerApi as jest.Mocked<typeof offerApi>;

// Mock user data
const mockAdminUser: User = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRegularUser: User = {
  id: 'user-id',
  email: 'user@example.com',
  name: 'Regular User',
  role: 'USER',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('useChatCommands Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCommand', () => {
    it('should parse slash commands correctly', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());
      
      const command = result.current.parseCommand('/list-offers 1 10');
      
      expect(command).toEqual({
        command: 'list-offers',
        args: ['1', '10'],
        raw: '/list-offers 1 10'
      });
    });

    it('should handle commands without arguments', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());
      
      const command = result.current.parseCommand('/help');
      
      expect(command).toEqual({
        command: 'help',
        args: [],
        raw: '/help'
      });
    });

    it('should return null for invalid commands', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());
      
      const command = result.current.parseCommand('invalid command');
      
      expect(command).toBeNull();
    });

    it('should handle commands with spaces in arguments', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());
      
      const command = result.current.parseCommand('/add-offer https://example.com/test');
      
      expect(command).toEqual({
        command: 'add-offer',
        args: ['https://example.com/test'],
        raw: '/add-offer https://example.com/test'
      });
    });
  });

  describe('executeCommand', () => {
    it('should execute help command successfully', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/help');
      });

      expect(response.type).toBe('system');
      expect(response.content).toContain('Available Commands:');
      expect(response.content).toContain('/list-offers');
      expect(response.content).toContain('/add-offer');
    });

    it('should handle authentication required for list-offers', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/list-offers');
      });

      expect(response.type).toBe('error');
      expect(response.content).toContain('Authentication required');
    });

    it('should execute list-offers command successfully', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const mockOffers = [
        {
          id: 'offer-1',
          title: 'Test Offer 1',
          status: 'ACTIVE' as const,
          category: 'FINANCE' as const,
          epcMetrics: {
            epc: 2.50,
            totalClicks: 100,
            totalConversions: 5
          }
        }
      ];

      mockedOfferApi.list.mockResolvedValue({
        success: true,
        data: {
          offers: mockOffers,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasMore: false
          }
        }
      });

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/list-offers');
      });

      expect(response.type).toBe('success');
      expect(response.content).toContain('Test Offer 1');
      expect(response.content).toContain('ACTIVE');
      expect(response.content).toContain('$2.50');
      expect(mockedOfferApi.list).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    it('should handle list-offers API error', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedOfferApi.list.mockResolvedValue({
        success: false,
        error: 'Failed to fetch offers'
      });

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/list-offers');
      });

      expect(response.type).toBe('error');
      expect(response.content).toContain('Failed to fetch offers');
    });

    it('should handle add-offer command with valid URL', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/add-offer https://example.com/offer');
      });

      expect(response.type).toBe('success');
      expect(response.content).toContain('Opening offer creation modal');
      expect(response.content).toContain('https://example.com/offer');
      expect(result.current.modalState.isOpen).toBe(true);
      expect(result.current.modalState.type).toBe('offer');
      expect(result.current.modalState.prefillData).toEqual({
        destinationUrl: 'https://example.com/offer'
      });
    });

    it('should reject add-offer for non-admin users', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockRegularUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/add-offer https://example.com/offer');
      });

      expect(response.type).toBe('error');
      expect(response.content).toContain('Admin access required');
    });

    it('should validate URL format for add-offer', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/add-offer invalid-url');
      });

      expect(response.type).toBe('error');
      expect(response.content).toContain('Invalid URL format');
    });

    it('should handle unknown commands', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/unknown-command');
      });

      expect(response.type).toBe('error');
      expect(response.content).toContain('Unknown command: unknown-command');
      expect(response.content).toContain('Type /help for available commands');
    });

    it('should handle command execution errors', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockedOfferApi.list.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChatCommands());

      let response;
      await act(async () => {
        response = await result.current.executeCommand('/list-offers');
      });

      expect(response.type).toBe('error');
      expect(response.content).toContain('Error loading offers: Network error');
    });
  });

  describe('Loading States', () => {
    it('should set loading state during command execution', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      // Mock slow API response
      mockedOfferApi.list.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            data: { offers: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false } }
          }), 100)
        )
      );

      const { result } = renderHook(() => useChatCommands());

      expect(result.current.isLoading).toBe(false);

      const promise = act(async () => {
        result.current.executeCommand('/list-offers');
      });

      expect(result.current.isLoading).toBe(true);

      await promise;

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Modal State Management', () => {
    it('should manage modal state correctly', async () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());

      expect(result.current.modalState.isOpen).toBe(false);

      await act(async () => {
        await result.current.executeCommand('/add-offer https://example.com');
      });

      expect(result.current.modalState.isOpen).toBe(true);
      expect(result.current.modalState.type).toBe('offer');

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.modalState.isOpen).toBe(false);
      expect(result.current.modalState.type).toBe(null);
    });
  });

  describe('Command Handlers Registry', () => {
    it('should return available commands', () => {
      mockedUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockAdminUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { result } = renderHook(() => useChatCommands());
      
      const commands = result.current.getAvailableCommands();
      
      expect(commands).toHaveLength(5); // help, list-offers, add-offer, list-questions, add-question
      expect(commands.map(cmd => cmd.name)).toContain('help');
      expect(commands.map(cmd => cmd.name)).toContain('list-offers');
      expect(commands.map(cmd => cmd.name)).toContain('add-offer');
    });
  });
});