import { Tabs } from 'expo-router';
import { TerminalNav } from '../../components/ui/TerminalNav';

export default function TabLayout() {
    return (
        <Tabs
            tabBar={props => <TerminalNav {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'MISSIONS',
                }}
            />
            <Tabs.Screen
                name="wallet"
                options={{
                    title: 'WALLET',
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'HISTORY',
                }}
            />
            <Tabs.Screen
                name="growth"
                options={{
                    title: 'GROWTH',
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'CONFIG',
                }}
            />
        </Tabs>
    );
}
