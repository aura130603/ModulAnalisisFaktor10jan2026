'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote, Star } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { motion, type Variants } from 'framer-motion';

export const TestimonialsSection = () => {
    const testimonials = [
        {
            quote: "Statify has been incredibly helpful for my research. The intuitive interface can be accessed from anywhere at no cost.",
            name: "Dr. Emily Johnson",
            role: "Statistics Professor",
            rating: 5,
            color: 'bg-blue-500/10 dark:bg-blue-500/20',
            iconColor: 'text-blue-500 dark:text-blue-400'
        },
        {
            quote: "The client-side approach makes data analysis faster. Everything runs in the browser without lag, even for large datasets.",
            name: "Michael Chen",
            role: "Data Researcher",
            rating: 5,
            color: 'bg-purple-500/10 dark:bg-purple-500/20',
            iconColor: 'text-purple-500 dark:text-purple-400'
        },
        {
            quote: "As a student, this platform is a lifesaver. All features are available for free and can be accessed anytime.",
            name: "Sofia Rodriguez",
            role: "Graduate Student",
            rating: 5,
            color: 'bg-amber-500/10 dark:bg-amber-500/20',
            iconColor: 'text-amber-500 dark:text-amber-400'
        }
    ];

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring",
                bounce: 0.4,
                duration: 0.8
            }
        }
    };

    const renderStars = (rating: number) => {
        return Array(rating).fill(0).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
        ));
    };

    return (
        <section id="testimonials" className="py-32 w-full bg-gradient-to-b from-muted/30 to-background">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <AnimatedSection className="text-center mb-20">
                    <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium rounded-full">
                        Success Stories
                    </Badge>
                    <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">What Our <span className="text-primary">Users Say</span></h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Researchers, academics, and data analysts worldwide rely on Statify for their statistical analysis needs.
                    </p>
                </AnimatedSection>

                <motion.div 
                    className="grid md:grid-cols-3 gap-8"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            variants={item}
                            className="h-full"
                        >
                            <Card
                                className="border border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col overflow-hidden group"
                            >
                                <CardHeader className={`${testimonial.color} border-b border-border/20 relative p-6`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className={`flex ${testimonial.iconColor}`}>
                                            {renderStars(testimonial.rating)}
                                        </div>
                                        <Quote className={`h-8 w-8 ${testimonial.iconColor} opacity-50 group-hover:opacity-80 transition-opacity`} />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 flex flex-col h-full">
                                    <blockquote className="text-muted-foreground text-base mb-6 flex-grow italic">
                                        &ldquo;{testimonial.quote}&rdquo;
                                    </blockquote>
                                    <div className="pt-4 border-t border-border/30 flex items-center">
                                        <div className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center mr-4`}>
                                            <span className={`text-lg font-semibold ${testimonial.iconColor}`}>
                                                {testimonial.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-card-foreground text-base group-hover:text-primary transition-colors">{testimonial.name}</div>
                                            <div className="text-muted-foreground text-sm mt-1">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}