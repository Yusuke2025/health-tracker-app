// データベース
const foodCalories = {
    "ご飯": 168,
    "パン": 264,
    "うどん": 105,
    "そば": 114,
    "ラーメン": 500,
    "カレーライス": 600,
    "ハンバーガー": 550,
    "ピザ": 290,
    "サラダ": 50,
    "ステーキ": 450,
    "魚": 200,
    "卵": 151,
    "牛乳": 67,
    "りんご": 54,
    "バナナ": 86,
    "おにぎり": 180,
    "弁当": 700,
    "スープ": 80,
    "野菜炒め": 150,
    "チキンカツ": 400
};

const exerciseCalories = {
    "ウォーキング": 3.5,
    "ジョギング": 7.0,
    "サイクリング": 6.0,
    "水泳": 8.0,
    "筋トレ": 5.0,
    "ヨガ": 2.5,
    "テニス": 6.5,
    "バスケットボール": 8.5,
    "サッカー": 7.5,
    "階段昇降": 4.5
};

// アプリケーション状態
class HealthApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.charts = {};
        this.storageAvailable = this.checkStorageAvailability();
        this.data = {
            weights: [],
            meals: [],
            exercises: []
        };
        this.init();
    }

    checkStorageAvailability() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            console.warn('LocalStorage not available, using memory storage');
            return false;
        }
    }

    init() {
        this.loadData();
        this.setupNavigation();
        this.setupForms();
        this.populateSelects();
        this.updateDashboard();
        this.initCharts();
    }

    // ナビゲーション設定
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav__item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page && page !== this.currentPage) {
                    this.navigateTo(page);
                }
            });
        });
    }

    navigateTo(page) {
        try {
            // アクティブなナビゲーションアイテムを更新
            document.querySelectorAll('.nav__item').forEach(item => {
                item.classList.remove('nav__item--active');
            });
            
            const targetNavItem = document.querySelector(`[data-page="${page}"]`);
            if (targetNavItem) {
                targetNavItem.classList.add('nav__item--active');
            }

            // ページを切り替え
            document.querySelectorAll('.page').forEach(p => {
                p.classList.remove('page--active');
            });
            
            const targetPage = document.getElementById(page);
            if (targetPage) {
                targetPage.classList.add('page--active');
                this.currentPage = page;

                // ページ固有の初期化
                setTimeout(() => {
                    if (page === 'dashboard') {
                        this.updateDashboard();
                    } else if (page === 'weight') {
                        this.displayWeightRecords();
                    } else if (page === 'food') {
                        this.displayFoodRecords();
                    } else if (page === 'exercise') {
                        this.displayExerciseRecords();
                    } else if (page === 'stats') {
                        this.updateStatsCharts();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Navigation error:', error);
        }
    }

    // フォーム設定
    setupForms() {
        // 体重フォーム
        const weightForm = document.getElementById('weight-form');
        if (weightForm) {
            weightForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveWeight();
            });
        }

        // 食事フォーム
        const foodForm = document.getElementById('food-form');
        if (foodForm) {
            foodForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFood();
            });
        }

        // 運動フォーム
        const exerciseForm = document.getElementById('exercise-form');
        if (exerciseForm) {
            exerciseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveExercise();
            });
        }

        // 画像アップロード
        const foodImageInput = document.getElementById('food-image');
        if (foodImageInput) {
            foodImageInput.addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });
        }

        // 食事選択時のカロリー自動計算
        const foodSelect = document.getElementById('food-select');
        if (foodSelect) {
            foodSelect.addEventListener('change', (e) => {
                this.updateFoodCalories(e.target.value);
            });
        }

        // 運動選択時のカロリー自動計算
        const exerciseSelect = document.getElementById('exercise-select');
        const durationInput = document.getElementById('duration-input');
        
        if (exerciseSelect) {
            exerciseSelect.addEventListener('change', () => {
                this.calculateExerciseCalories();
            });
        }

        if (durationInput) {
            durationInput.addEventListener('input', () => {
                this.calculateExerciseCalories();
            });
        }
    }

    // セレクトボックスの項目を設定
    populateSelects() {
        // 食事選択
        const foodSelect = document.getElementById('food-select');
        if (foodSelect) {
            // 既存のオプションをクリア（初期のoption以外）
            Array.from(foodSelect.options).slice(1).forEach(opt => opt.remove());
            
            Object.keys(foodCalories).forEach(food => {
                const option = document.createElement('option');
                option.value = food;
                option.textContent = `${food} (${foodCalories[food]}kcal)`;
                foodSelect.appendChild(option);
            });
        }

        // 運動選択
        const exerciseSelect = document.getElementById('exercise-select');
        if (exerciseSelect) {
            // 既存のオプションをクリア（初期のoption以外）
            Array.from(exerciseSelect.options).slice(1).forEach(opt => opt.remove());
            
            Object.keys(exerciseCalories).forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise;
                option.textContent = `${exercise} (${exerciseCalories[exercise]}kcal/分)`;
                exerciseSelect.appendChild(option);
            });
        }
    }

    // データ保存・読み込み
    saveToStorage(key, data) {
        if (this.storageAvailable) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
            }
        }
        // メモリにも保存
        this.data[key] = [...data];
    }

    loadFromStorage(key) {
        if (this.storageAvailable) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    this.data[key] = parsed;
                    return parsed;
                }
            } catch (e) {
                console.warn('Failed to load from localStorage:', e);
            }
        }
        return this.data[key] || [];
    }

    loadData() {
        // 各データ型を読み込み
        this.loadFromStorage('weights');
        this.loadFromStorage('meals');
        this.loadFromStorage('exercises');

        // サンプルデータがない場合のみ初期化
        if (this.data.weights.length === 0) {
            this.initSampleData();
        }
    }

    initSampleData() {
        // サンプルデータを初期化
        const sampleWeights = [
            {date: "2025-06-01", weight: 70.2, height: 170},
            {date: "2025-06-02", weight: 70.0, height: 170},
            {date: "2025-06-03", weight: 69.8, height: 170}
        ];
        
        const sampleMeals = [
            {date: "2025-06-12", type: "朝食", food: "ご飯", calories: 168},
            {date: "2025-06-12", type: "昼食", food: "弁当", calories: 700}
        ];
        
        const sampleExercises = [
            {date: "2025-06-12", type: "ウォーキング", duration: 30, calories: 105}
        ];

        this.saveToStorage('weights', sampleWeights);
        this.saveToStorage('meals', sampleMeals);
        this.saveToStorage('exercises', sampleExercises);
    }

    // 食事カロリー更新
    updateFoodCalories(selectedFood) {
        const caloriesInput = document.getElementById('calories-input');
        if (caloriesInput && selectedFood && foodCalories[selectedFood]) {
            caloriesInput.value = foodCalories[selectedFood];
        }
    }

    // 体重記録
    saveWeight() {
        try {
            const weightInput = document.getElementById('weight-input');
            const heightInput = document.getElementById('height-input');
            
            if (!weightInput || !weightInput.value) {
                alert('体重を入力してください');
                return;
            }

            const weight = parseFloat(weightInput.value);
            const height = heightInput.value ? parseFloat(heightInput.value) : null;
            const date = new Date().toISOString().split('T')[0];

            if (isNaN(weight) || weight <= 0) {
                alert('正しい体重を入力してください');
                return;
            }

            const weights = this.loadFromStorage('weights');
            
            // 同じ日の記録があるかチェック
            const existingIndex = weights.findIndex(w => w.date === date);
            if (existingIndex >= 0) {
                weights[existingIndex] = {date, weight, height};
            } else {
                weights.push({date, weight, height});
            }
            
            this.saveToStorage('weights', weights);

            // フォームをリセット
            document.getElementById('weight-form').reset();
            
            // 表示を更新
            this.displayWeightRecords();
            this.updateDashboard();
            this.updateWeightChart();
            
            alert('体重を記録しました！');
        } catch (error) {
            console.error('Error saving weight:', error);
            alert('体重の保存に失敗しました');
        }
    }

    displayWeightRecords() {
        const weights = this.loadFromStorage('weights');
        const container = document.getElementById('weight-records');
        
        if (!container) return;
        
        if (weights.length === 0) {
            container.innerHTML = '<div class="empty-state">まだ記録がありません</div>';
            return;
        }

        const sortedWeights = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = sortedWeights.map(record => {
            const bmi = record.height ? (record.weight / ((record.height / 100) ** 2)).toFixed(1) : '--';
            return `
                <div class="record-item">
                    <div class="record-info">
                        <div class="record-title">${record.date}</div>
                        <div class="record-details">
                            体重: ${record.weight}kg
                            ${record.height ? `| BMI: ${bmi}` : ''}
                        </div>
                    </div>
                    <div class="record-actions">
                        <button class="btn-delete" onclick="app.deleteWeight('${record.date}')">削除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 食事記録
    handleImageUpload(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('image-preview');
        
        if (!preview) return;
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="食事画像">`;
                
                // 画像に基づいた簡易的な食事推定
                this.suggestFoodFromImage(file.name);
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    suggestFoodFromImage(filename) {
        // ファイル名から食事を推定（簡易実装）
        const suggestions = {
            'rice': 'ご飯',
            'bread': 'パン',
            'noodle': 'うどん',
            'ramen': 'ラーメン',
            'curry': 'カレーライス',
            'burger': 'ハンバーガー',
            'pizza': 'ピザ',
            'salad': 'サラダ'
        };

        const lowerFilename = filename.toLowerCase();
        const foodSelect = document.getElementById('food-select');
        
        for (const [key, value] of Object.entries(suggestions)) {
            if (lowerFilename.includes(key)) {
                if (foodSelect) {
                    foodSelect.value = value;
                    this.updateFoodCalories(value);
                }
                break;
            }
        }
    }

    saveFood() {
        try {
            const foodSelect = document.getElementById('food-select');
            const mealTypeSelect = document.getElementById('meal-type');
            const caloriesInput = document.getElementById('calories-input');
            
            if (!foodSelect || !foodSelect.value) {
                alert('食事内容を選択してください');
                return;
            }

            const food = foodSelect.value;
            const type = mealTypeSelect ? mealTypeSelect.value : '食事';
            const calories = caloriesInput ? parseInt(caloriesInput.value) || 0 : 0;
            const date = new Date().toISOString().split('T')[0];

            if (calories <= 0) {
                alert('正しいカロリーを入力してください');
                return;
            }

            const meals = this.loadFromStorage('meals');
            const newMeal = {
                date, 
                type, 
                food, 
                calories,
                timestamp: Date.now()
            };
            
            meals.push(newMeal);
            this.saveToStorage('meals', meals);

            // フォームをリセット
            document.getElementById('food-form').reset();
            const imagePreview = document.getElementById('image-preview');
            if (imagePreview) {
                imagePreview.innerHTML = '';
            }
            
            // 表示を更新
            this.displayFoodRecords();
            this.updateDashboard();
            
            alert('食事を記録しました！');
        } catch (error) {
            console.error('Error saving food:', error);
            alert('食事の保存に失敗しました');
        }
    }

    displayFoodRecords() {
        const meals = this.loadFromStorage('meals');
        const today = new Date().toISOString().split('T')[0];
        const todayMeals = meals.filter(meal => meal.date === today);
        
        const container = document.getElementById('food-records');
        const totalCaloriesSpan = document.getElementById('total-calories');
        
        if (!container) return;
        
        if (todayMeals.length === 0) {
            container.innerHTML = '<div class="empty-state">今日の食事記録がありません</div>';
            if (totalCaloriesSpan) totalCaloriesSpan.textContent = '0';
            return;
        }

        const totalCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        if (totalCaloriesSpan) {
            totalCaloriesSpan.textContent = totalCalories;
        }

        const sortedMeals = [...todayMeals].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        container.innerHTML = sortedMeals.map((meal, index) => `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-title">${meal.type} - ${meal.food}</div>
                    <div class="record-details">${meal.calories} kcal</div>
                </div>
                <div class="record-actions">
                    <button class="btn-delete" onclick="app.deleteFood(${index}, '${meal.date}', '${meal.type}', '${meal.food}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    // 運動記録
    calculateExerciseCalories() {
        const exerciseSelect = document.getElementById('exercise-select');
        const durationInput = document.getElementById('duration-input');
        const exerciseCaloriesInput = document.getElementById('exercise-calories');
        
        if (!exerciseSelect || !durationInput || !exerciseCaloriesInput) return;
        
        const exercise = exerciseSelect.value;
        const duration = parseInt(durationInput.value) || 0;
        
        if (exercise && exerciseCalories[exercise] && duration > 0) {
            const calories = Math.round(exerciseCalories[exercise] * duration);
            exerciseCaloriesInput.value = calories;
        } else {
            exerciseCaloriesInput.value = '';
        }
    }

    saveExercise() {
        try {
            const exerciseSelect = document.getElementById('exercise-select');
            const durationInput = document.getElementById('duration-input');
            const exerciseCaloriesInput = document.getElementById('exercise-calories');
            
            if (!exerciseSelect || !exerciseSelect.value) {
                alert('運動種類を選択してください');
                return;
            }

            if (!durationInput || !durationInput.value) {
                alert('運動時間を入力してください');
                return;
            }

            const type = exerciseSelect.value;
            const duration = parseInt(durationInput.value);
            const calories = exerciseCaloriesInput ? parseInt(exerciseCaloriesInput.value) || 0 : 0;
            const date = new Date().toISOString().split('T')[0];

            if (duration <= 0) {
                alert('正しい運動時間を入力してください');
                return;
            }

            const exercises = this.loadFromStorage('exercises');
            const newExercise = {
                date, 
                type, 
                duration, 
                calories,
                timestamp: Date.now()
            };
            
            exercises.push(newExercise);
            this.saveToStorage('exercises', exercises);

            // フォームをリセット
            document.getElementById('exercise-form').reset();
            
            // 表示を更新
            this.displayExerciseRecords();
            this.updateDashboard();
            
            alert('運動を記録しました！');
        } catch (error) {
            console.error('Error saving exercise:', error);
            alert('運動の保存に失敗しました');
        }
    }

    displayExerciseRecords() {
        const exercises = this.loadFromStorage('exercises');
        const today = new Date().toISOString().split('T')[0];
        const todayExercises = exercises.filter(exercise => exercise.date === today);
        
        const container = document.getElementById('exercise-records');
        const totalCaloriesSpan = document.getElementById('total-exercise-calories');
        
        if (!container) return;
        
        if (todayExercises.length === 0) {
            container.innerHTML = '<div class="empty-state">今日の運動記録がありません</div>';
            if (totalCaloriesSpan) totalCaloriesSpan.textContent = '0';
            return;
        }

        const totalCalories = todayExercises.reduce((sum, exercise) => sum + (exercise.calories || 0), 0);
        if (totalCaloriesSpan) {
            totalCaloriesSpan.textContent = totalCalories;
        }

        const sortedExercises = [...todayExercises].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        container.innerHTML = sortedExercises.map((exercise, index) => `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-title">${exercise.type}</div>
                    <div class="record-details">${exercise.duration}分 - ${exercise.calories} kcal</div>
                </div>
                <div class="record-actions">
                    <button class="btn-delete" onclick="app.deleteExercise(${index}, '${exercise.date}', '${exercise.type}', ${exercise.duration})">削除</button>
                </div>
            </div>
        `).join('');
    }

    // ダッシュボード更新
    updateDashboard() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 今日の体重
            const weights = this.loadFromStorage('weights');
            const todayWeight = weights.find(w => w.date === today);
            
            const todayWeightEl = document.getElementById('today-weight');
            const todayBmiEl = document.getElementById('today-bmi');
            
            if (todayWeight) {
                if (todayWeightEl) todayWeightEl.textContent = todayWeight.weight;
                if (todayWeight.height && todayBmiEl) {
                    const bmi = (todayWeight.weight / ((todayWeight.height / 100) ** 2)).toFixed(1);
                    todayBmiEl.textContent = bmi;
                }
            } else {
                if (todayWeightEl) todayWeightEl.textContent = '--';
                if (todayBmiEl) todayBmiEl.textContent = '--';
            }

            // 今日の食事
            const meals = this.loadFromStorage('meals');
            const todayMeals = meals.filter(meal => meal.date === today);
            const totalCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
            
            const todayCaloriesEl = document.getElementById('today-calories');
            const todayMealsEl = document.getElementById('today-meals');
            
            if (todayCaloriesEl) todayCaloriesEl.textContent = totalCalories;
            if (todayMealsEl) todayMealsEl.textContent = todayMeals.length;

            // 今日の運動
            const exercises = this.loadFromStorage('exercises');
            const todayExercises = exercises.filter(exercise => exercise.date === today);
            const totalExerciseCalories = todayExercises.reduce((sum, exercise) => sum + (exercise.calories || 0), 0);
            const totalExerciseTime = todayExercises.reduce((sum, exercise) => sum + (exercise.duration || 0), 0);
            
            const todayExerciseCaloriesEl = document.getElementById('today-exercise-calories');
            const todayExerciseTimeEl = document.getElementById('today-exercise-time');
            
            if (todayExerciseCaloriesEl) todayExerciseCaloriesEl.textContent = totalExerciseCalories;
            if (todayExerciseTimeEl) todayExerciseTimeEl.textContent = totalExerciseTime;

            // 体重推移チャート（ダッシュボード用）
            setTimeout(() => {
                this.updateWeightChart();
            }, 200);
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    // チャート初期化
    initCharts() {
        setTimeout(() => {
            this.updateWeightChart();
        }, 500);
    }

    updateWeightChart() {
        try {
            const weights = this.loadFromStorage('weights');
            const last7Days = weights.slice(-7);
            
            const canvas = document.getElementById('weight-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (this.charts.weightChart) {
                this.charts.weightChart.destroy();
            }

            this.charts.weightChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: last7Days.map(w => {
                        const date = new Date(w.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                    }),
                    datasets: [{
                        label: '体重 (kg)',
                        data: last7Days.map(w => w.weight),
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating weight chart:', error);
        }
    }

    updateStatsCharts() {
        setTimeout(() => {
            this.updateStatsWeightChart();
            this.updateStatsCaloriesChart();
        }, 200);
    }

    updateStatsWeightChart() {
        try {
            const weights = this.loadFromStorage('weights');
            const canvas = document.getElementById('stats-weight-chart');
            
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (this.charts.statsWeightChart) {
                this.charts.statsWeightChart.destroy();
            }

            this.charts.statsWeightChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: weights.map(w => {
                        const date = new Date(w.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                    }),
                    datasets: [{
                        label: '体重 (kg)',
                        data: weights.map(w => w.weight),
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '体重推移'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating stats weight chart:', error);
        }
    }

    updateStatsCaloriesChart() {
        try {
            const meals = this.loadFromStorage('meals');
            
            // 過去7日間のデータを集計
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                last7Days.push(dateStr);
            }

            const caloriesData = last7Days.map(date => {
                const dayMeals = meals.filter(meal => meal.date === date);
                return dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
            });

            const canvas = document.getElementById('stats-calories-chart');
            
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (this.charts.statsCaloriesChart) {
                this.charts.statsCaloriesChart.destroy();
            }

            this.charts.statsCaloriesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: last7Days.map(date => {
                        const d = new Date(date);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                    }),
                    datasets: [{
                        label: 'カロリー (kcal)',
                        data: caloriesData,
                        backgroundColor: '#FFC185',
                        borderColor: '#B4413C',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '週間カロリー摂取量'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating stats calories chart:', error);
        }
    }

    // 削除機能
    deleteWeight(date) {
        if (confirm('この記録を削除しますか？')) {
            try {
                const weights = this.loadFromStorage('weights');
                const filtered = weights.filter(w => w.date !== date);
                this.saveToStorage('weights', filtered);
                this.displayWeightRecords();
                this.updateDashboard();
                this.updateWeightChart();
            } catch (error) {
                console.error('Error deleting weight:', error);
                alert('削除に失敗しました');
            }
        }
    }

    deleteFood(index, date, type, food) {
        if (confirm('この記録を削除しますか？')) {
            try {
                const meals = this.loadFromStorage('meals');
                const today = new Date().toISOString().split('T')[0];
                const todayMeals = meals.filter(meal => meal.date === today);
                
                if (index >= 0 && index < todayMeals.length) {
                    const mealToDelete = todayMeals[index];
                    const allMealsFiltered = meals.filter(m => 
                        !(m.date === mealToDelete.date && 
                          m.type === mealToDelete.type && 
                          m.food === mealToDelete.food &&
                          m.timestamp === mealToDelete.timestamp)
                    );
                    this.saveToStorage('meals', allMealsFiltered);
                    this.displayFoodRecords();
                    this.updateDashboard();
                }
            } catch (error) {
                console.error('Error deleting food:', error);
                alert('削除に失敗しました');
            }
        }
    }

    deleteExercise(index, date, type, duration) {
        if (confirm('この記録を削除しますか？')) {
            try {
                const exercises = this.loadFromStorage('exercises');
                const today = new Date().toISOString().split('T')[0];
                const todayExercises = exercises.filter(exercise => exercise.date === today);
                
                if (index >= 0 && index < todayExercises.length) {
                    const exerciseToDelete = todayExercises[index];
                    const allExercisesFiltered = exercises.filter(e => 
                        !(e.date === exerciseToDelete.date && 
                          e.type === exerciseToDelete.type && 
                          e.duration === exerciseToDelete.duration &&
                          e.timestamp === exerciseToDelete.timestamp)
                    );
                    this.saveToStorage('exercises', allExercisesFiltered);
                    this.displayExerciseRecords();
                    this.updateDashboard();
                }
            } catch (error) {
                console.error('Error deleting exercise:', error);
                alert('削除に失敗しました');
            }
        }
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HealthApp();
});

// グローバル関数（削除ボタンから呼び出される）
window.app = app;