# Authentication Setup Documentation

## Primary Login Interface

The login screen (`client/src/SimpleAuth.tsx`) serves as the main authentication interface for the AI瞬間英作文チャット application.

## Access Flow

1. **Main Application**: Users access the training interface directly
2. **Logout Path**: MyPage → Account Tab → Logout Button → Login Screen
3. **No Direct Login Button**: The main interface does not show a login button (user preference)

## Login Screen Features

### Design Elements
- Gradient background: `bg-gradient-to-br from-blue-100 to-purple-100`
- White rounded card: `bg-white rounded-2xl shadow-xl p-8 w-full max-w-md`
- Blue logo circle with "AI" text
- Title: "AI瞬間英作文チャット" (login) / "AI英作文チャット" (signup)

### Form Components
- Email input with Mail icon
- Password input with Lock icon and toggle visibility
- Remember me checkbox (login only)
- Terms and Privacy checkboxes (signup only)
- Submit button with loading state
- Google authentication option

### Authentication States
- **Login Mode**: Email, password, remember me checkbox
- **Signup Mode**: Email, password, confirm password, terms acceptance
- **Loading State**: Buttons show loading spinner during authentication
- **Mode Toggle**: "アカウントをお持ちでない方は新規登録" link

## Component Structure

```tsx
interface SimpleAuthProps {
  onClose?: () => void;
}

export function SimpleAuth({ onClose }: SimpleAuthProps)
```

## Integration Points

1. **CompleteTrainingUI.tsx**: Shows auth overlay when `showAuth` state is true
2. **MyPage.tsx**: Logout button triggers auth screen via `onShowAuth` callback
3. **Authentication State**: Managed through prop callbacks and page reloads

## Preservation Notes

- This login screen matches provided screenshot designs exactly
- Interface serves as permanent main authentication entry point
- User explicitly requested this screen be preserved and always accessible
- No modifications should be made to the design without user approval