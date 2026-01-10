use statrs::distribution::{ ChiSquared, FisherSnedecor, Normal, StudentsT, ContinuousCDF };

pub fn calculate_f_significance(df1: usize, df2: usize, f_value: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value.is_nan() || f_value < 0.0 {
        return f64::NAN;
    }

    // p-value = 1 - CDF(f_value)
    FisherSnedecor::new(df1 as f64, df2 as f64).map_or(f64::NAN, |dist| {
        let cdf_val = dist.cdf(f_value);
        (1.0 - cdf_val).max(0.0)
    })
}

pub fn calculate_chi_sq_significance(chi_sq_value: f64, df: u64) -> f64 {
    if df == 0 || chi_sq_value.is_nan() || chi_sq_value < 0.0 {
        return f64::NAN;
    }

    // p-value = 1 - CDF(f_value)
    ChiSquared::new(df as f64).map_or(f64::NAN, |dist| {
        let cdf_val = dist.cdf(chi_sq_value);
        (1.0 - cdf_val).max(0.0)
    })
}

pub fn calculate_t_significance(t_value: f64, df: usize) -> f64 {
    if df == 0 || t_value.is_nan() {
        return f64::NAN;
    }

    // p-value = 2 * P(T >= |t_value|) atau 2 * P(T <= -|t_value|).
    StudentsT::new(0.0, 1.0, df as f64).map_or(f64::NAN, |dist| 2.0 * dist.cdf(-t_value.abs()))
}

pub fn calculate_t_critical(alpha: Option<f64>, df: usize) -> f64 {
    let alpha_val = alpha.unwrap_or(0.05);
    if df == 0 {
        // aproksimasi dengan distribusi Normal (z-score).
        Normal::new(0.0, 1.0).map_or(1.96, |dist| dist.inverse_cdf(1.0 - alpha_val / 2.0))
    } else {
        StudentsT::new(0.0, 1.0, df as f64).map_or(f64::NAN, |dist| {
            dist.inverse_cdf(1.0 - alpha_val / 2.0)
        })
    }
}

pub fn calculate_f_critical(alpha: f64, df1: usize, df2: usize) -> f64 {
    if df1 == 0 || df2 == 0 || alpha <= 0.0 || alpha >= 1.0 {
        return f64::NAN;
    }

    FisherSnedecor::new(df1 as f64, df2 as f64).map_or(f64::NAN, |dist|
        dist.inverse_cdf(1.0 - alpha)
    )
}

pub fn calculate_f_non_centrality(f_value: f64, df1: f64, _df2: f64) -> f64 {
    if f_value.is_nan() || f_value < 0.0 || df1 < 0.0 {
        return f64::NAN;
    }

    f_value * df1
}

pub fn noncentral_f_cdf(f_prime: f64, df1: f64, df2: f64, lambda: f64) -> f64 {
    if f_prime < 0.0 || df1 <= 0.0 || df2 <= 0.0 || lambda < 0.0 {
        return f64::NAN;
    }

    let f_adjusted = (df1 / (df1 + lambda)) * f_prime;
    let df1_adjusted = (df1 + lambda).powi(2) / (df1 + 2.0 * lambda);

    match FisherSnedecor::new(df1_adjusted, df2) {
        Ok(dist) => dist.cdf(f_adjusted).max(0.0).min(1.0),
        Err(_) => f64::NAN,
    }
}

pub fn noncentral_t_cdf(t_prime: f64, nu: f64, delta: f64) -> f64 {
    if nu <= 0.0 {
        return f64::NAN;
    }

    let numerator = t_prime * (1.0 - 1.0 / (4.0 * nu)) - delta;
    let denominator = (1.0 + t_prime.powi(2) / (2.0 * nu)).sqrt();

    let x_approx = numerator / denominator;

    match Normal::new(0.0, 1.0) {
        Ok(norm_dist) => {
            let cdf_val = norm_dist.cdf(x_approx);
            cdf_val.max(0.0).min(1.0)
        }
        Err(_) => f64::NAN,
    }
}

pub fn calculate_observed_power_f(f_value: f64, df1: f64, df2: f64, alpha_for_test: f64) -> f64 {
    if
        df1 <= 0.0 ||
        df2 <= 0.0 ||
        f_value < 0.0 ||
        f_value.is_nan() ||
        alpha_for_test <= 0.0 ||
        alpha_for_test >= 1.0
    {
        return f64::NAN;
    }

    let ncp = f_value * df1;

    let central_dist_res = FisherSnedecor::new(df1, df2);
    let crit_f = match central_dist_res {
        Ok(dist) => dist.inverse_cdf(1.0 - alpha_for_test),
        Err(_) => {
            return f64::NAN;
        }
    };

    if crit_f.is_nan() {
        return f64::NAN;
    }

    let cdf = noncentral_f_cdf(crit_f, df1, df2, ncp);

    // Power = 1 - CDF_noncentral(F_critical).
    let power = if cdf.is_nan() { f64::NAN } else { (1.0 - cdf).max(0.0).min(1.0) };

    power
}

pub fn calculate_observed_power_t(t_value: f64, df: usize, alpha: Option<f64>) -> f64 {
    let alpha_val = alpha.unwrap_or(0.05);
    if df == 0 || t_value.is_nan() {
        return f64::NAN;
    }

    let ncp = t_value.abs();

    let central_t_dist_res = StudentsT::new(0.0, 1.0, df as f64);
    let crit_t_abs = match central_t_dist_res {
        Ok(dist) => dist.inverse_cdf(1.0 - alpha_val / 2.0).abs(),
        Err(_) => {
            return f64::NAN;
        }
    };

    if crit_t_abs.is_nan() {
        return f64::NAN;
    }

    let df_f64 = df as f64;

    // Power = (1 - CDF(t_crit)) + CDF(-t_crit)
    let cdf_pos_crit = noncentral_t_cdf(crit_t_abs, df_f64, ncp);
    let cdf_neg_crit = noncentral_t_cdf(-crit_t_abs, df_f64, ncp);

    if cdf_pos_crit.is_nan() || cdf_neg_crit.is_nan() {
        return f64::NAN;
    }

    let power = 1.0 - cdf_pos_crit + cdf_neg_crit;

    if power.is_nan() {
        return f64::NAN;
    }
    power.max(0.0).min(1.0)
}

pub fn chi_square_cdf(x: f64, df: f64) -> f64 {
    if x < 0.0 || df <= 0.0 {
        return 0.0;
    }
    ChiSquared::new(df).map_or(0.0, |dist| dist.cdf(x).max(0.0).min(1.0))
}

pub fn f_distribution_cdf(x: f64, df1: f64, df2: f64) -> f64 {
    if x < 0.0 || df1 <= 0.0 || df2 <= 0.0 {
        return 0.0;
    }
    FisherSnedecor::new(df1, df2).map_or(0.0, |dist| dist.cdf(x).max(0.0).min(1.0))
}
