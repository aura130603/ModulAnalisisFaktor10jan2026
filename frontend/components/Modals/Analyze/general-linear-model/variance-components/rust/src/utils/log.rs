// Structure untuk pencatatan fungsi yang dieksekusi
#[derive(Debug, Clone, Default)]
pub struct FunctionLogger {
    executed_functions: Vec<String>,
}

impl FunctionLogger {
    // Menambahkan fungsi baru ke logger
    pub fn add_log(&mut self, function_name: &str) {
        self.executed_functions.push(function_name.to_string());
    }

    // Mengecek apakah ada fungsi yang dieksekusi
    pub fn has_logs(&self) -> bool {
        !self.executed_functions.is_empty()
    }

    // Mendapatkan seluruh fungsi yang dieksekusi sebagai formatted string
    pub fn get_log_summary(&self) -> String {
        if !self.has_logs() {
            return "Tidak ada fungsi yang dieksekusi.".to_string();
        }

        let mut summary = String::from("Daftar Fungsi yang Dieksekusi:\n");
        for (i, function) in self.executed_functions.iter().enumerate() {
            summary.push_str(&format!("  {}. {}\n", i + 1, function));
        }

        summary
    }

    // Mendapatkan daftar fungsi yang dieksekusi
    pub fn get_executed_functions(&self) -> Vec<String> {
        self.executed_functions.clone()
    }
}
