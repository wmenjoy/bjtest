// Package examples 提供高质量的 Go 测试示例
// AI 应该参考这些示例来生成符合规范的测试代码

package examples

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// ============================================================
// 示例 1: 基本单元测试
// ============================================================

// TestCalculate_BasicCases 展示基本的测试结构
func TestCalculate_BasicCases(t *testing.T) {
	// 单独测试正常情况
	t.Run("returns square of positive number", func(t *testing.T) {
		// Arrange
		input := 5
		expected := 25

		// Act
		result := Calculate(input)

		// Assert
		assert.Equal(t, expected, result)
	})

	// 单独测试边界情况
	t.Run("returns zero for zero input", func(t *testing.T) {
		result := Calculate(0)
		assert.Equal(t, 0, result)
	})
}

// ============================================================
// 示例 2: 表驱动测试（推荐用于多场景测试）
// ============================================================

// TestValidateEmail_TableDriven 展示表驱动测试的标准写法
func TestValidateEmail_TableDriven(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		wantErr bool
		errType error
	}{
		{
			name:    "valid email",
			email:   "user@example.com",
			wantErr: false,
		},
		{
			name:    "empty email",
			email:   "",
			wantErr: true,
			errType: ErrEmptyEmail,
		},
		{
			name:    "missing at sign",
			email:   "userexample.com",
			wantErr: true,
			errType: ErrInvalidFormat,
		},
		{
			name:    "missing domain",
			email:   "user@",
			wantErr: true,
			errType: ErrInvalidFormat,
		},
		{
			name:    "unicode email",
			email:   "用户@example.com",
			wantErr: false, // 或 true，取决于业务要求
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateEmail(tt.email)

			if tt.wantErr {
				require.Error(t, err)
				if tt.errType != nil {
					assert.ErrorIs(t, err, tt.errType)
				}
				return
			}

			require.NoError(t, err)
		})
	}
}

// ============================================================
// 示例 3: Mock 测试（依赖注入）
// ============================================================

// MockUserRepository 是 UserRepository 的 mock 实现
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*User), args.Error(1)
}

func (m *MockUserRepository) Save(ctx context.Context, user *User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

// TestUserService_GetUser_WithMock 展示如何使用 mock
func TestUserService_GetUser_WithMock(t *testing.T) {
	t.Run("returns user when found", func(t *testing.T) {
		// Arrange
		ctx := context.Background()
		expectedUser := &User{
			ID:    "user-123",
			Name:  "Test User",
			Email: "test@example.com",
		}

		mockRepo := new(MockUserRepository)
		mockRepo.On("FindByID", ctx, "user-123").Return(expectedUser, nil)

		service := NewUserService(mockRepo)

		// Act
		user, err := service.GetUser(ctx, "user-123")

		// Assert
		require.NoError(t, err)
		assert.Equal(t, expectedUser.ID, user.ID)
		assert.Equal(t, expectedUser.Name, user.Name)
		assert.Equal(t, expectedUser.Email, user.Email)

		// 验证 mock 调用
		mockRepo.AssertExpectations(t)
	})

	t.Run("returns error when user not found", func(t *testing.T) {
		// Arrange
		ctx := context.Background()

		mockRepo := new(MockUserRepository)
		mockRepo.On("FindByID", ctx, "non-existent").Return(nil, ErrUserNotFound)

		service := NewUserService(mockRepo)

		// Act
		user, err := service.GetUser(ctx, "non-existent")

		// Assert
		require.Error(t, err)
		assert.ErrorIs(t, err, ErrUserNotFound)
		assert.Nil(t, user)

		mockRepo.AssertExpectations(t)
	})

	t.Run("returns error when repository fails", func(t *testing.T) {
		// Arrange
		ctx := context.Background()
		dbErr := errors.New("database connection failed")

		mockRepo := new(MockUserRepository)
		mockRepo.On("FindByID", ctx, mock.Anything).Return(nil, dbErr)

		service := NewUserService(mockRepo)

		// Act
		user, err := service.GetUser(ctx, "user-123")

		// Assert
		require.Error(t, err)
		assert.Contains(t, err.Error(), "database")
		assert.Nil(t, user)
	})
}

// ============================================================
// 示例 4: HTTP Handler 测试
// ============================================================

func TestUserHandler_GetUser(t *testing.T) {
	t.Run("returns 200 with user data", func(t *testing.T) {
		// Arrange
		expectedUser := &User{ID: "123", Name: "Test"}

		mockService := new(MockUserService)
		mockService.On("GetUser", mock.Anything, "123").Return(expectedUser, nil)

		handler := NewUserHandler(mockService)

		// 创建测试请求
		req := httptest.NewRequest(http.MethodGet, "/users/123", nil)
		rec := httptest.NewRecorder()

		// Act
		handler.GetUser(rec, req)

		// Assert
		assert.Equal(t, http.StatusOK, rec.Code)

		var response User
		err := json.Unmarshal(rec.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, expectedUser.ID, response.ID)
		assert.Equal(t, expectedUser.Name, response.Name)
	})

	t.Run("returns 404 when user not found", func(t *testing.T) {
		// Arrange
		mockService := new(MockUserService)
		mockService.On("GetUser", mock.Anything, "non-existent").
			Return(nil, ErrUserNotFound)

		handler := NewUserHandler(mockService)

		req := httptest.NewRequest(http.MethodGet, "/users/non-existent", nil)
		rec := httptest.NewRecorder()

		// Act
		handler.GetUser(rec, req)

		// Assert
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})

	t.Run("returns 500 on internal error", func(t *testing.T) {
		// Arrange
		mockService := new(MockUserService)
		mockService.On("GetUser", mock.Anything, mock.Anything).
			Return(nil, errors.New("internal error"))

		handler := NewUserHandler(mockService)

		req := httptest.NewRequest(http.MethodGet, "/users/123", nil)
		rec := httptest.NewRecorder()

		// Act
		handler.GetUser(rec, req)

		// Assert
		assert.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}

// ============================================================
// 示例 5: 测试辅助函数
// ============================================================

// createTestUser 是一个测试辅助函数，创建测试用户
// t.Helper() 使得错误报告指向调用者而非这个函数
func createTestUser(t *testing.T, id string) *User {
	t.Helper()
	return &User{
		ID:        id,
		Name:      "Test User " + id,
		Email:     id + "@example.com",
		CreatedAt: time.Now(),
	}
}

// setupTestDB 创建测试数据库连接
func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite3", ":memory:")
	require.NoError(t, err, "failed to open test database")

	t.Cleanup(func() {
		db.Close()
	})

	return db
}

// ============================================================
// 示例 6: 并行测试
// ============================================================

func TestParallelExample(t *testing.T) {
	t.Parallel() // 标记测试可以并行执行

	tests := []struct {
		name  string
		input int
		want  int
	}{
		{"case1", 1, 1},
		{"case2", 2, 4},
		{"case3", 3, 9},
	}

	for _, tt := range tests {
		tt := tt // 捕获循环变量（Go < 1.22 需要）
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel() // 子测试也并行
			result := Calculate(tt.input)
			assert.Equal(t, tt.want, result)
		})
	}
}

// ============================================================
// 占位类型和函数（实际项目中应该导入真实实现）
// ============================================================

type User struct {
	ID        string
	Name      string
	Email     string
	CreatedAt time.Time
}

var (
	ErrEmptyEmail    = errors.New("email is empty")
	ErrInvalidFormat = errors.New("invalid email format")
	ErrUserNotFound  = errors.New("user not found")
)

func Calculate(n int) int               { return n * n }
func ValidateEmail(email string) error  { return nil }
func NewUserService(repo interface{}) interface{} { return nil }
