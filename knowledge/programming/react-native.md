# React Native Development

## Project Setup

```bash
# Expo (recommended for beginners)
npx create-expo-app@latest my-app
cd my-app
npx expo start

# Bare React Native (full native access)
npx react-native init MyApp --template react-native-template-typescript
cd MyApp
npx react-native run-ios
npx react-native run-android
```

## Navigation (React Navigation v6)

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
# iOS
cd ios && pod install
```

```tsx
// navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

type RootStackParamList = {
    Home: undefined;
    Profile: { userId: string };
    Settings: undefined;
    Chat: { conversationId: string };
    Modal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: '#fff' },
                    headerTintColor: '#000',
                    headerTitleAlign: 'center',
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen 
                    name="Profile" 
                    component={ProfileScreen}
                    options={{ title: 'Profile' }}
                />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen 
                    name="Chat" 
                    component={ChatScreen}
                    options={({ route }) => ({ title: `Chat ${route.params.conversationId}` })}
                />
                <Stack.Screen 
                    name="Modal" 
                    component={ModalScreen}
                    options={{ presentation: 'modal' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// Usage
function HomeScreen({ navigation }: { navigation: StackNavigationProp<RootStackParamList, 'Home'> }) {
    return (
        <Button 
            title="Go to Profile" 
            onPress={() => navigation.navigate('Profile', { userId: '123' })}
        />
    );
}
```

## State Management

### Zustand (Lightweight)

```bash
npm install zustand @react-native-async-storage/async-storage
```

```tsx
// store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: string;
    name: string;
    email: string;
    token: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            
            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    set({ user: response.data, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },
            
            logout: () => set({ user: null }),
            
            updateProfile: (data) => set(state => ({
                user: state.user ? { ...state.user, ...data } : null
            })),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ user: state.user }),
        }
    )
);
```

### React Query (Server State)

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

```tsx
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 min
            cacheTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppNavigator />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

// hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePosts() {
    return useQuery({
        queryKey: ['posts'],
        queryFn: () => api.get('/posts').then(res => res.data),
    });
}

export function useCreatePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePostInput) => api.post('/posts', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
}

// Usage
function PostsScreen() {
    const { data, isLoading, error } = usePosts();
    const createPost = useCreatePost();
    
    if (isLoading) return <ActivityIndicator />;
    if (error) return <Text>Error: {error.message}</Text>;
    
    return (
        <FlatList
            data={data}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <PostCard post={item} />}
        />
    );
}
```

## Styling

### StyleSheet (Performance)

```tsx
// styles/home.styles.ts
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    card: {
        margin: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    // Dynamic width
    image: {
        width: width - 32,
        height: 200,
        borderRadius: 8,
    },
});
```

### Tailwind CSS (NativeWind)

```bash
npm install nativewind tailwindcss
npx tailwindcss init
```

```js
// tailwind.config.js
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: { extend: {} },
    plugins: [],
};
```

```tsx
// babel.config.js
module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: ['nativewind/babel'],
};
```

```tsx
// Usage
import { StyleSheet } from 'react-native';

function Card({ title, children }) {
    return (
        <View className="bg-white rounded-xl p-4 m-4 shadow-md">
            <Text className="text-xl font-bold text-gray-900 mb-2">{title}</Text>
            {children}
        </View>
    );
}
```

## Components

### Custom Hooks

```tsx
// hooks/useKeyboard.ts
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

export function useKeyboard() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
            setKeyboardHeight(e.endCoordinates.height);
            setIsVisible(true);
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            setIsVisible(false);
        });
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    return { keyboardHeight, isVisible };
}

// Usage
function LoginScreen() {
    const { keyboardHeight } = useKeyboard();
    
    return (
        <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={100}
            style={{ flex: 1, paddingBottom: keyboardHeight }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <TextInput placeholder="Email" />
                <TextInput placeholder="Password" secureTextEntry />
                <Button title="Login" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
```

```tsx
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    
    return debounced;
}

// Usage
function SearchScreen() {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 300);
    
    const { data } = useSearch(debouncedQuery);
    // ...
}
```

### Reusable Components

```tsx
// components/Button.tsx
import { Pressable, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

const variantStyles: Record<ButtonProps['variant'], ViewStyle> = {
    primary: { backgroundColor: '#007AFF' },
    secondary: { backgroundColor: '#5856D6' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#007AFF' },
    danger: { backgroundColor: '#FF3B30' },
};

const sizeStyles: Record<ButtonProps['size'], { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 },
};

export function Button({ 
    title, onPress, variant = 'primary', size = 'md', 
    disabled, loading, leftIcon, rightIcon, style, textStyle 
}: ButtonProps) {
    const isDisabled = disabled || loading;
    const sizes = sizeStyles[size];
    
    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={[
                styles.container,
                variantStyles[variant],
                { ...sizes },
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#007AFF' : '#fff'} size="small" />
            ) : (
                <>
                    {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                    <Text style={[
                        styles.text,
                        variant === 'outline' ? { color: '#007AFF' } : { color: '#fff' },
                        sizes,
                        textStyle,
                    ]}>{title}</Text>
                    {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
                </>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        minHeight: 44,
    },
    disabled: { opacity: 0.5 },
    text: { fontWeight: '600', textAlign: 'center' },
    iconLeft: { marginRight: 8 },
    iconRight: { marginLeft: 8 },
});
```

```tsx
// components/Input.tsx
import { TextInput, TextInputProps, StyleSheet, ViewStyle } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
}

export function Input({ label, error, leftIcon, rightIcon, style, ...props }: InputProps) {
    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                error && styles.inputError,
                leftIcon && styles.hasLeftIcon,
                rightIcon && styles.hasRightIcon,
            ]}>
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                <TextInput
                    style={[
                        styles.input,
                        leftIcon && styles.inputWithLeftIcon,
                        rightIcon && styles.inputWithRightIcon,
                    ]}
                    {...props}
                />
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
    },
    inputError: { borderColor: '#FF3B30' },
    hasLeftIcon: { paddingLeft: 12 },
    hasRightIcon: { paddingRight: 12 },
    input: { flex: 1, height: 48, fontSize: 16, color: '#1a1a1a' },
    inputWithLeftIcon: { paddingLeft: 8 },
    inputWithRightIcon: { paddingRight: 8 },
    iconLeft: { marginRight: 8 },
    iconRight: { marginLeft: 8 },
    errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4, marginLeft: 4 },
});
```

## Lists & Performance

### FlatList Optimization

```tsx
import { FlatList, FlatListProps } from 'react-native';

interface Post {
    id: string;
    title: string;
    content: string;
    author: User;
    createdAt: string;
}

function PostList({ posts }: { posts: Post[] }) {
    const renderItem = useCallback(({ item }: { item: Post }) => (
        <PostCard post={item} />
    ), []);

    const keyExtractor = useCallback((item: Post) => item.id, []);

    const getItemLayout = useCallback((data: any, index: number) => ({
        length: 120,
        offset: 120 * index,
        index,
    }), []);

    return (
        <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            contentContainerStyle={styles.content}
            ListEmptyComponent={<EmptyState />}
            ListFooterComponent={<LoadMore />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
        />
    );
}
```

### FlashList (Better Performance)

```bash
npm install @shopify/flash-list
```

```tsx
import { FlashList } from "@shopify/flash-list";

function PostList({ posts }: { posts: Post[] }) {
    return (
        <FlashList
            data={posts}
            renderItem={({ item }) => <PostCard post={item} />}
            keyExtractor={item => item.id}
            estimatedItemSize={120}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
        />
    );
}
```

## Animations

### Reanimated 3

```bash
npm install react-native-reanimated
# babel.config.js
plugins: ['react-native-reanimated/plugin'],
```

```tsx
// components/AnimatedCard.tsx
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
    interpolate,
    runOnJS 
} from 'react-native-reanimated';

export function AnimatedCard({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(0.8, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(1, { duration: 100 });
    };

    return (
        <Animated.View style={animatedStyle}>
            <Pressable 
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}
```

```tsx
// Animated list items
const translateY = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [0, -50], [1, 0]),
}));

useEffect(() => {
    translateY.value = withDelay(index * 50, withSpring(0, { damping: 20 }));
}, []);

// In render
<Animated.View style={[styles.item, animatedStyle]}>...</Animated.View>
```

## Device Features

### Camera

```bash
npx expo install expo-camera expo-media-library
```

```tsx
// components/CameraView.tsx
import { Camera, CameraType } from 'expo-camera';
import { MediaLibrary } from 'expo-media-library';

export function CameraView({ onCapture }: { onCapture: (uri: string) => void }) {
    const [type, setType] = useState(CameraType.back);
    const [permission, requestPermission] = Camera.useCameraPermissions();
    const cameraRef = useRef<Camera>(null);

    if (!permission?.granted) {
        return (
            <View style={styles.container}>
                <Text>Camera permission needed</Text>
                <Button title="Grant Permission" onPress={requestPermission} />
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });
            onCapture(photo.uri);
        }
    };

    return (
        <View style={styles.container}>
            <Camera style={styles.camera} type={type} ref={cameraRef}>
                <View style={styles.controls}>
                    <Button title="Flip" onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)} />
                    <Button title="Capture" onPress={takePicture} style={{ backgroundColor: '#fff', borderRadius: 30, width: 60, height: 60 }} />
                </View>
            </Camera>
        </View>
    );
}
```

### Location

```bash
npx expo install expo-location
```

```tsx
// hooks/useLocation.ts
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export function useLocation() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Permission denied');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(loc);
        })();
    }, []);

    return { location, error };
}
```

### Notifications

```bash
npx expo install expo-notifications expo-device
```

```tsx
// utils/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export async function registerForPushNotifications() {
    if (!Device.isDevice) return null;
    
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
}

export async function sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: null, // immediate
    });
}
```

## Testing

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

```tsx
// __tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/Button';

describe('Button', () => {
    it('renders correctly', () => {
        const { getByText } = render(<Button title="Test" onPress={() => {}} />);
        expect(getByText('Test')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const onPress = jest.fn();
        const { getByText } = render(<Button title="Test" onPress={onPress} />);
        fireEvent.press(getByText('Test'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        const { getByText } = render(<Button title="Test" onPress={onPress} disabled />);
        fireEvent.press(getByText('Test'));
        expect(onPress).not.toHaveBeenCalled();
    });
});
```

```tsx
// __tests__/AuthStore.test.ts
import { useAuthStore } from '../store/useAuthStore';

describe('AuthStore', () => {
    beforeEach(() => {
        useAuthStore.setState({ user: null });
    });

    it('logs in user', async () => {
        // Mock API
        const mockLogin = jest.fn().mockResolvedValue({ data: { id: '1', name: 'Test', email: 'test@test.com', token: 'abc' } });
        
        // Test would need store with injected API
        // ...
    });
});
```

## Building & Deployment

```bash
# Expo (EAS)
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android

# Bare React Native
# iOS
cd ios
xcodebuild -workspace MyApp.xcworkspace -scheme MyApp -configuration Release -archivePath MyApp.xcarchive archive
xcodebuild -exportArchive -archivePath MyApp.xcarchive -exportPath ./build -exportOptionsPlist ExportOptions.plist

# Android
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

```json
// eas.json
{
    "cli": { "version": ">= 5.0.0" },
    "build": {
        "development": {
            "developmentClient": true,
            "distribution": "internal"
        },
        "preview": {
            "distribution": "internal",
            "android": { "buildType": "apk" }
        },
        "production": {
            "autoIncrement": true,
            "ios": { "buildConfiguration": "Release" },
            "android": { "buildType": "app-bundle" }
        }
    },
    "submit": {
        "production": {
            "ios": { "appleId": "your@email.com", "ascAppId": "123456789" },
            "android": { "serviceAccountKeyPath": "./google-play-key.json", "track": "production" }
        }
    }
}
```

## Performance Checklist

- [ ] Use `FlashList` instead of `FlatList` for large lists
- [ ] Implement `getItemLayout` for fixed-height items
- [ ] Use `React.memo` for list items
- [ ] Memoize callbacks with `useCallback`
- [ ] Use `useSharedValue` + Reanimated for animations
- [ ] Enable `removeClippedSubviews` on lists
- [ ] Use `initialNumToRender` and `maxToRenderPerBatch`
- [ ] Optimize images (WebP, proper sizing, caching)
- [ ] Use `react-native-fast-image` for better image loading
- [ ] Profile with `react-native-performance-monitor`
- [ ] Use Hermes engine (enabled by default in 0.70+)
- [ ] Enable `newArchEnabled: true` in gradle.properties
- [ ] Bundle analyzer: `npx react-native-bundle-visualizer`
- [ ] Monitor JS thread with `why-did-you-render`

## Common Issues

| Issue | Solution |
|-------|----------|
| Metro cache issues | `npx expo start -c` or `npx react-native start --reset-cache` |
| iOS build fails | `cd ios && pod deintegrate && pod install` |
| Android build fails | `cd android && ./gradlew clean` |
| Font not loading | Use `expo-font` or `useFonts` hook |
| Deep linking not working | Check `app.json` scheme, `Linking.addEventListener` |
| Keyboard covers input | Use `KeyboardAvoidingView` + `ScrollView` |
| Reanimated not working | Check babel plugin order, enable on UI thread |
| Memory leaks | Clean up listeners in `useEffect` return |
| Slow navigation | Use `react-native-screens`, lazy load screens |

## Debugging

```bash
# React Native Debugger
brew install --cask react-native-debugger

# Flipper (included in RN 0.68+)
# Automatic if installed

# Console logs
npx react-native log-ios
npx react-native log-android

# Network inspection
# Flipper > Network tab
# Or: npx react-native-devtools
```

```tsx
// Debug component renders
import { whyDidYouRender } from '@welldone-software/why-did-you-render';

whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOnDifferentValues: true,
    collapseGroups: true,
});

// Usage
function MyComponent() { ... }
MyComponent.whyDidYouRender = true;
```