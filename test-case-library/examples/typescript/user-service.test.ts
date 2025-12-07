/**
 * TypeScript 测试示例 - AI 参考代码
 *
 * 本文件展示 Jest + TypeScript 的最佳实践
 * AI 应该参考这些示例来生成符合规范的 TypeScript 测试代码
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// ============================================================
// 类型定义
// ============================================================

interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

interface CreateUserRequest {
    email: string;
    name: string;
}

interface UserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    save(user: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    findAll(): Promise<User[]>;
}

interface EmailService {
    sendWelcomeEmail(user: User): Promise<void>;
}

// ============================================================
// 示例 1: 基本测试结构
// ============================================================

describe('UserService', () => {
    // Mock 定义
    let mockUserRepository: jest.Mocked<UserRepository>;
    let mockEmailService: jest.Mocked<EmailService>;
    let userService: UserService;

    // 每个测试前重置
    beforeEach(() => {
        // 创建 mock 对象
        mockUserRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
        };

        mockEmailService = {
            sendWelcomeEmail: jest.fn(),
        };

        // 创建被测服务
        userService = new UserService(mockUserRepository, mockEmailService);

        // 清除所有 mock 调用记录
        jest.clearAllMocks();
    });

    // --------------------------------------------------------
    // 使用 describe 嵌套组织测试
    // --------------------------------------------------------

    describe('createUser', () => {
        const validRequest: CreateUserRequest = {
            email: 'test@example.com',
            name: 'Test User',
        };

        it('should create user with valid data', async () => {
            // Arrange
            const expectedUser: User = {
                id: 'generated-id',
                email: validRequest.email,
                name: validRequest.name,
                createdAt: new Date(),
            };

            mockUserRepository.findByEmail.mockResolvedValue(null);
            mockUserRepository.save.mockResolvedValue(expectedUser);
            mockEmailService.sendWelcomeEmail.mockResolvedValue();

            // Act
            const result = await userService.createUser(validRequest);

            // Assert
            expect(result).toEqual(expectedUser);
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRequest.email);
            expect(mockUserRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: validRequest.email,
                    name: validRequest.name,
                })
            );
            expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(expectedUser);
        });

        it('should throw error when email already exists', async () => {
            // Arrange
            const existingUser: User = {
                id: 'existing-id',
                email: validRequest.email,
                name: 'Existing User',
                createdAt: new Date(),
            };

            mockUserRepository.findByEmail.mockResolvedValue(existingUser);

            // Act & Assert
            await expect(userService.createUser(validRequest))
                .rejects
                .toThrow('Email already exists');

            expect(mockUserRepository.save).not.toHaveBeenCalled();
            expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
        });

        it('should throw error when request is null', async () => {
            await expect(userService.createUser(null as any))
                .rejects
                .toThrow('Request cannot be null');
        });

        it('should throw error when email is empty', async () => {
            const invalidRequest = { email: '', name: 'Test' };

            await expect(userService.createUser(invalidRequest))
                .rejects
                .toThrow('Email is required');
        });
    });

    // ============================================================
    // 示例 2: 查询测试
    // ============================================================

    describe('findById', () => {
        it('should return user when found', async () => {
            // Arrange
            const expectedUser: User = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                createdAt: new Date(),
            };

            mockUserRepository.findById.mockResolvedValue(expectedUser);

            // Act
            const result = await userService.findById('user-123');

            // Assert
            expect(result).toEqual(expectedUser);
            expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
        });

        it('should return null when user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);

            const result = await userService.findById('non-existent');

            expect(result).toBeNull();
        });

        it('should throw error for invalid id', async () => {
            await expect(userService.findById('')).rejects.toThrow('Invalid user ID');
        });
    });

    // ============================================================
    // 示例 3: 参数化测试 (test.each)
    // ============================================================

    describe('validateEmail', () => {
        // 表格形式的参数化测试
        test.each([
            ['valid@email.com', true],
            ['user.name@domain.org', true],
            ['user+tag@example.com', true],
            ['', false],
            ['invalid', false],
            ['@nodomain.com', false],
            ['noat.com', false],
            ['spaces in@email.com', false],
        ])('should validate email "%s" as %s', (email, expected) => {
            const result = userService.isValidEmail(email);
            expect(result).toBe(expected);
        });

        // 对象形式的参数化测试（更可读）
        test.each([
            { email: 'valid@test.com', valid: true, description: '标准邮箱' },
            { email: 'user@中文.com', valid: true, description: '中文域名' },
            { email: null, valid: false, description: 'null 值' },
            { email: undefined, valid: false, description: 'undefined 值' },
        ])('$description: $email should be $valid', ({ email, valid }) => {
            const result = userService.isValidEmail(email as string);
            expect(result).toBe(valid);
        });
    });

    // ============================================================
    // 示例 4: 异步测试
    // ============================================================

    describe('async operations', () => {
        it('should handle async success', async () => {
            mockUserRepository.findAll.mockResolvedValue([]);

            const result = await userService.getAllUsers();

            expect(result).toEqual([]);
        });

        it('should handle async rejection', async () => {
            mockUserRepository.findAll.mockRejectedValue(new Error('Database error'));

            await expect(userService.getAllUsers()).rejects.toThrow('Database error');
        });

        it('should handle timeout', async () => {
            // 模拟延迟
            mockUserRepository.findById.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve(null), 5000))
            );

            // 设置超时
            jest.useFakeTimers();

            const promise = userService.findByIdWithTimeout('user-123', 1000);

            jest.advanceTimersByTime(1000);

            await expect(promise).rejects.toThrow('Operation timed out');

            jest.useRealTimers();
        });
    });

    // ============================================================
    // 示例 5: Mock 高级用法
    // ============================================================

    describe('advanced mocking', () => {
        it('should verify call order', async () => {
            const request = { email: 'test@example.com', name: 'Test' };

            mockUserRepository.findByEmail.mockResolvedValue(null);
            mockUserRepository.save.mockResolvedValue({
                id: '1',
                ...request,
                createdAt: new Date()
            });

            await userService.createUser(request);

            // 验证调用顺序
            const findByEmailOrder = mockUserRepository.findByEmail.mock.invocationCallOrder[0];
            const saveOrder = mockUserRepository.save.mock.invocationCallOrder[0];
            const sendEmailOrder = mockEmailService.sendWelcomeEmail.mock.invocationCallOrder[0];

            expect(findByEmailOrder).toBeLessThan(saveOrder);
            expect(saveOrder).toBeLessThan(sendEmailOrder);
        });

        it('should capture arguments', async () => {
            const request = { email: 'test@example.com', name: 'Test User' };

            mockUserRepository.findByEmail.mockResolvedValue(null);
            mockUserRepository.save.mockImplementation(async (user) => ({
                ...user,
                id: 'generated-id',
                createdAt: new Date(),
            } as User));

            await userService.createUser(request);

            // 捕获并验证传入的参数
            const savedUser = mockUserRepository.save.mock.calls[0][0];
            expect(savedUser).toMatchObject({
                email: 'test@example.com',
                name: 'Test User',
            });
        });

        it('should mock implementation', async () => {
            let callCount = 0;

            mockUserRepository.findById.mockImplementation(async (id) => {
                callCount++;
                if (callCount === 1) {
                    return null; // 第一次返回 null
                }
                return { id, email: 'test@example.com', name: 'Test', createdAt: new Date() };
            });

            const result1 = await userService.findById('user-1');
            const result2 = await userService.findById('user-1');

            expect(result1).toBeNull();
            expect(result2).not.toBeNull();
        });
    });

    // ============================================================
    // 示例 6: 集合和对象断言
    // ============================================================

    describe('collection assertions', () => {
        it('should return all users with correct structure', async () => {
            const users: User[] = [
                { id: '1', email: 'alice@example.com', name: 'Alice', createdAt: new Date() },
                { id: '2', email: 'bob@example.com', name: 'Bob', createdAt: new Date() },
                { id: '3', email: 'charlie@example.com', name: 'Charlie', createdAt: new Date() },
            ];

            mockUserRepository.findAll.mockResolvedValue(users);

            const result = await userService.getAllUsers();

            // 数组断言
            expect(result).toHaveLength(3);
            expect(result).toContainEqual(expect.objectContaining({ name: 'Alice' }));
            expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({ email: 'bob@example.com' }),
            ]));

            // 每个元素都满足条件
            result.forEach((user) => {
                expect(user).toHaveProperty('id');
                expect(user).toHaveProperty('email');
                expect(user.email).toMatch(/@example\.com$/);
            });
        });

        it('should match partial object', async () => {
            const user: User = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                createdAt: new Date(),
            };

            mockUserRepository.findById.mockResolvedValue(user);

            const result = await userService.findById('user-123');

            // 部分匹配
            expect(result).toMatchObject({
                email: 'test@example.com',
                name: 'Test User',
            });

            // 对象包含特定属性
            expect(result).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    createdAt: expect.any(Date),
                })
            );
        });
    });
});

// ============================================================
// 示例 7: React 组件测试 (参考)
// ============================================================

/*
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
    });

    it('should render login form', () => {
        render(<LoginForm onSubmit={mockOnSubmit} />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should submit form with valid data', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });
    });

    it('should show validation error for invalid email', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByLabelText(/email/i), 'invalid-email');
        await user.click(screen.getByRole('button', { name: /login/i }));

        expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should disable button while submitting', async () => {
        const user = userEvent.setup();
        mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

        render(<LoginForm onSubmit={mockOnSubmit} />);

        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /login/i }));

        expect(screen.getByRole('button')).toBeDisabled();
    });
});
*/

// ============================================================
// 占位类（实际项目中应该导入真实实现）
// ============================================================

class UserService {
    constructor(
        private userRepository: UserRepository,
        private emailService: EmailService
    ) {}

    async createUser(request: CreateUserRequest): Promise<User> {
        // 实现...
        throw new Error('Not implemented');
    }

    async findById(id: string): Promise<User | null> {
        throw new Error('Not implemented');
    }

    async findByIdWithTimeout(id: string, timeout: number): Promise<User | null> {
        throw new Error('Not implemented');
    }

    async getAllUsers(): Promise<User[]> {
        throw new Error('Not implemented');
    }

    isValidEmail(email: string): boolean {
        throw new Error('Not implemented');
    }
}
