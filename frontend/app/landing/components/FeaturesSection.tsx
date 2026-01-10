'use client';

import { FileText, Edit, DatabaseZap, Wand2, BarChart, HelpCircle, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

export const FeaturesSection = () => {
    const features = [
        { 
            icon: <FileText className="h-10 w-10 text-primary" />, 
            title: 'File', 
            description: 'Import, export and manage your data files with ease.',
            color: 'bg-blue-500/10 dark:bg-blue-500/20',
            iconColor: 'text-blue-500 dark:text-blue-400'
        },
        { 
            icon: <Edit className="h-10 w-10 text-primary" />, 
            title: 'Edit', 
            description: 'Quick and intuitive data editing capabilities.',
            color: 'bg-green-500/10 dark:bg-green-500/20',
            iconColor: 'text-green-500 dark:text-green-400'
        },
        { 
            icon: <DatabaseZap className="h-10 w-10 text-primary" />, 
            title: 'Data', 
            description: 'Powerful dataset manipulation and transformation tools.',
            color: 'bg-purple-500/10 dark:bg-purple-500/20',
            iconColor: 'text-purple-500 dark:text-purple-400'
        },
        { 
            icon: <Wand2 className="h-10 w-10 text-primary" />, 
            title: 'Transform', 
            description: 'Advanced variable transformations and calculations.',
            color: 'bg-amber-500/10 dark:bg-amber-500/20',
            iconColor: 'text-amber-500 dark:text-amber-400'
        },
        { 
            icon: <BarChart className="h-10 w-10 text-primary" />, 
            title: 'Graphs', 
            description: 'Create beautiful and insightful data visualizations.',
            color: 'bg-cyan-500/10 dark:bg-cyan-500/20',
            iconColor: 'text-cyan-500 dark:text-cyan-400'
        },
        { 
            icon: <HelpCircle className="h-10 w-10 text-primary" />, 
            title: 'Help', 
            description: 'Comprehensive guides and documentation at your fingertips.',
            color: 'bg-rose-500/10 dark:bg-rose-500/20',
            iconColor: 'text-rose-500 dark:text-rose-400'
        }
    ];

    const analyzeSubfeatures = [
        {name: 'Descriptive', description: 'Frequencies, descriptives, explore and crosstabs'},
        {name: 'Compare Means', description: 'T-tests and one-way ANOVA'},
        {name: 'General Linear Model', description: 'Univariate, multivariate and repeated measures'},
        {name: 'Classify', description: 'Cluster analysis, discriminant and factor analysis'},
        {name: 'Dimension Reduction', description: 'Principal component analysis and factor analysis'},
        {name: 'Correlate', description: 'Bivariate, partial and distances'},
        {name: 'Regression', description: 'Linear, logistic, and curve estimation'},
        {name: 'Nonparametric Tests', description: 'Chi-square, binomial, and K-related samples'},
        {name: 'Time Series', description: 'ARIMA models and forecasting'}
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.5
            } 
        }
    };

    return (
        <section id="features" className="py-32 w-full bg-gradient-to-b from-background to-muted/30">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <AnimatedSection className="text-center mb-20">
                    <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium rounded-full">
                        Powerful Statistics
                    </Badge>
                    <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">SPSS-like Features, <span className="text-primary">Modern Interface</span></h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Get all the statistical power you need with a refreshing, intuitive user experience designed for modern workflows.
                    </p>
                </AnimatedSection>
                
                <div className="grid grid-cols-1 gap-8 mb-16">
                    <motion.div 
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        {features.map((feature, index) => (
                            <motion.div key={index} variants={item}>
                                <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 h-full overflow-hidden group">
                                    <CardHeader>
                                        <div className={`${feature.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                            <div className={feature.iconColor}>
                                                {feature.icon}
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                                        <CardDescription className="text-base mt-2">{feature.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                    
                    <motion.div 
                        className="mt-16"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <Card className="border border-primary/20 shadow-lg overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center">
                                        <Brain className="h-10 w-10 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl mb-1">Analyze</CardTitle>
                                        <CardDescription className="text-base">Comprehensive statistical analysis tools</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {analyzeSubfeatures.map((sub, index) => (
                                        <Card key={index} className="bg-muted/50 border-none hover:bg-muted transition-colors duration-200">
                                            <CardHeader className="p-4">
                                                <CardTitle className="text-base font-medium">{sub.name}</CardTitle>
                                                <CardDescription className="text-sm mt-1">{sub.description}</CardDescription>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}