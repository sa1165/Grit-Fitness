import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Platform,
    SafeAreaView,
    useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Logger } from '../utils/Logger';


// Removed static Dimensions.get('window') for useWindowDimensions

const ProgressScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'year'
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{ data: [0] }]
    });
    const [stats, setStats] = useState({ totalVolume: 0, workoutCount: 0 });

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let startDate = new Date();
            if (timeframe === 'week') {
                // Start of current week (Sunday)
                startDate.setDate(startDate.getDate() - startDate.getDay());
                startDate.setHours(0, 0, 0, 0);
            } else if (timeframe === 'month') {
                // Start of current month
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
            } else {
                // Start of current year
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
            }

            const { data, error } = await supabase
                .from('workouts')
                .select('created_at, total_volume')
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            processChartData(data);
        } catch (err) {
            Logger.error('ProgressScreen', 'Error fetching progress data', err);
        } finally {
            setLoading(false);
        }
    }, [user, timeframe]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const processChartData = (data) => {
        let labels = [];
        let volumeData = [];
        let totalVolume = 0;
        let workoutCount = data.length;

        if (timeframe === 'week') {
            // Group by Day (Sun to Sat) of current week
            const now = new Date();
            const dayOfWeek = now.getDay();
            const sun = new Date(now);
            sun.setDate(now.getDate() - dayOfWeek);
            sun.setHours(0, 0, 0, 0);

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const weekLabels = [];
            const weekVolumes = [0, 0, 0, 0, 0, 0, 0];

            data.forEach(workout => {
                const date = new Date(workout.created_at);
                const diff = Math.floor((date - sun) / (1000 * 60 * 60 * 24));
                if (diff >= 0 && diff < 7) {
                    weekVolumes[diff] += Number(workout.total_volume) || 0;
                    totalVolume += Number(workout.total_volume) || 0;
                }
            });

            labels = days;
            volumeData = weekVolumes;
        } else if (timeframe === 'month') {
            // Group by Week 1, Week 2, Week 3, Week 4 (Avg Volume)
            const weekStats = [
                { total: 0, count: 0 }, // Week 1 (1-7)
                { total: 0, count: 0 }, // Week 2 (8-14)
                { total: 0, count: 0 }, // Week 3 (15-21)
                { total: 0, count: 0 }  // Week 4 (22+)
            ];

            data.forEach(workout => {
                const date = new Date(workout.created_at);
                const day = date.getDate();
                let weekIdx = 0;
                if (day <= 7) weekIdx = 0;
                else if (day <= 14) weekIdx = 1;
                else if (day <= 21) weekIdx = 2;
                else weekIdx = 3;

                weekStats[weekIdx].total += Number(workout.total_volume) || 0;
                weekStats[weekIdx].count += 1;
                totalVolume += Number(workout.total_volume) || 0;
            });

            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            volumeData = weekStats.map(s => s.count > 0 ? s.total / s.count : 0);
        } else {
            // Group by Month (Jan to Dec) - Avg Volume
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthStats = months.map(() => ({ total: 0, count: 0 }));

            data.forEach(workout => {
                const date = new Date(workout.created_at);
                const monthIdx = date.getMonth();
                monthStats[monthIdx].total += Number(workout.total_volume) || 0;
                monthStats[monthIdx].count += 1;
                totalVolume += Number(workout.total_volume) || 0;
            });

            labels = months;
            volumeData = monthStats.map(s => s.count > 0 ? s.total / s.count : 0);
        }

        setChartData({
            labels: labels.length > 0 ? labels : ['None'],
            datasets: [{ data: volumeData.length > 0 ? volumeData.map(v => Math.round(v)) : [0] }]
        });
        setStats({ totalVolume, workoutCount });
    };

    const chartConfig = {
        backgroundColor: '#000',
        backgroundGradientFrom: '#111',
        backgroundGradientTo: '#000',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`, // App Blue
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForLabels: {
            fontSize: 10,
        },
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#4A90E2"
        },
        propsForBackgroundLines: {
            stroke: "#333",
            strokeDasharray: "" // solid lines
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Progress</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.timeframeSelector}>
                {['week', 'month', 'year'].map((t) => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.timeframeBtn, timeframe === t && styles.timeframeBtnActive]}
                        onPress={() => setTimeframe(t)}
                    >
                        <Text style={[styles.timeframeText, timeframe === t && styles.timeframeTextActive]}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Total Volume ({timeframe})</Text>
                            <Text style={styles.statValue}>{stats.totalVolume.toLocaleString()} kg</Text>
                            <Text style={styles.statSub}>{stats.workoutCount} Workouts</Text>
                        </View>

                        {stats.workoutCount > 0 ? (
                            <>
                                <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>
                                {timeframe === 'week' ? 'Volume Trend (Total)' : 'Volume Trend (Avg per Workout)'}
                            </Text>
                            <LineChart
                                data={{
                                    ...chartData,
                                    labels: chartData.labels
                                }}
                                width={width - 48}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withInnerLines={true}
                                withOuterLines={false}
                                withVerticalLines={false}
                                withHorizontalLines={true}
                                withShadow={true}
                            />
                        </View>

                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Consistency (Workouts)</Text>
                            <BarChart
                                data={{
                                    ...chartData,
                                    labels: chartData.labels
                                }}
                                width={width - 48}
                                height={220}
                                chartConfig={{
                                    ...chartConfig,
                                    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                                }}
                                style={styles.chart}
                                withInnerLines={false}
                                fromZero={true}
                            />
                        </View>
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="barbell-outline" size={48} color="#333" />
                                <Text style={styles.emptyStateText}>No workouts recorded for this {timeframe}.</Text>
                                <TouchableOpacity 
                                    style={styles.startBtn}
                                    onPress={() => navigation.navigate('Workout')}
                                >
                                    <Text style={styles.startBtnText}>Start your first workout</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backBtn: {
        padding: 4,
    },
    timeframeSelector: {
        flexDirection: 'row',
        backgroundColor: '#111',
        margin: 16,
        borderRadius: 12,
        padding: 4,
    },
    timeframeBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    timeframeBtnActive: {
        backgroundColor: '#4A90E2',
    },
    timeframeText: {
        color: '#888',
        fontWeight: '600',
        fontSize: 14,
    },
    timeframeTextActive: {
        color: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    statCard: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    statLabel: {
        color: '#888',
        fontSize: 14,
        marginBottom: 8,
    },
    statValue: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    statSub: {
        color: '#4A90E2',
        fontSize: 14,
        marginTop: 4,
        fontWeight: '600',
    },
    chartContainer: {
        marginBottom: 25,
    },
    chartTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
    },
    chart: {
        borderRadius: 16,
        marginVertical: 8,
        paddingRight: 15, // Increased padding
        alignSelf: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyStateText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 25,
    },
    startBtn: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    startBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    }
});

export default ProgressScreen;
