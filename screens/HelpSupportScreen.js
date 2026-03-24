import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FAQS = [
    {
        question: "How do I use Grit effectively?",
        answer: "Grit is designed to keep you consistent. Build your plan in the 'Workout' tab, complete your exercises daily, and watch your Grit Score grow in the 'Progress' tab."
    },
    {
        question: "What should I do if I miss a workout?",
        answer: "Consistency is key, but rest is important too. Don't stress a missed day—just get back on track tomorrow. Your Grit Score rewards long-term dedication."
    },
    {
        question: "How is my Grit Score calculated?",
        answer: "Your Grit Score increases as you complete scheduled workouts and log your daily progress consistently. Stick to your plan to watch it grow!"
    },
    {
        question: "Can I use Grit offline?",
        answer: "No, Grit requires an active internet connection to sync your daily logs, update your Grit Score, and save your workout plans securely."
    }
];

const HelpSupportScreen = ({ navigation }) => {
    const [expandedFaq, setExpandedFaq] = useState(null);

    const toggleFaq = (index) => {
        if (expandedFaq === index) {
            setExpandedFaq(null);
        } else {
            setExpandedFaq(index);
        }
    };

    const handleContactSupport = () => {
        Linking.openURL('https://mail.google.com/mail/?view=cm&fs=1&to=sanjeevofficial24082005@gmail.com');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 24 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.heroSection}>
                    <Ionicons name="help-buoy" size={64} color="#4A90E2" />
                    <Text style={styles.heroTitle}>How can we help?</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    
                    {FAQS.map((faq, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.faqCard}
                            onPress={() => toggleFaq(index)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons 
                                    name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                                    size={20} 
                                    color="#888" 
                                />
                            </View>
                            {expandedFaq === index && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <TouchableOpacity style={styles.contactCard} onPress={handleContactSupport}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="mail" size={24} color="#FFF" />
                        </View>
                        <View style={styles.contactTextContainer}>
                            <Text style={styles.contactTitle} numberOfLines={1} adjustsFontSizeToFit>sanjeevofficial24082005@gmail.com</Text>
                            <Text style={styles.contactSub}>We typically respond within 24 hours</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Grit</Text>
                    <Text style={styles.versionNumber}>Version 1.0.0 (Build 34)</Text>
                    <Text style={styles.madeWithText}>Better everyday.</Text>
                </View>

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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 10,
    },
    heroTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
    },
    section: {
        marginBottom: 35,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    faqCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        paddingRight: 10,
    },
    faqAnswer: {
        color: '#AAA',
        fontSize: 14,
        lineHeight: 22,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contactTextContainer: {
        flex: 1,
    },
    contactTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    contactSub: {
        color: '#888',
        fontSize: 13,
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        paddingTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#111',
    },
    versionText: {
        color: '#4A90E2',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        letterSpacing: 2,
    },
    versionNumber: {
        color: '#666',
        fontSize: 14,
        marginBottom: 15,
    },
    madeWithText: {
        color: '#444',
        fontSize: 12,
        fontStyle: 'italic',
    }
});

export default HelpSupportScreen;
