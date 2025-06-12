// データベース (foodCalories, exerciseCalories) は変更なし
const foodCalories = {
    "ご飯": 168, "パン": 264, "うどん": 105, "そば": 114, "ラーメン": 500, "カレーライス": 600,
    "ハンバーガー": 550, "ピザ": 290, "サラダ": 50, "ステーキ": 450, "魚": 200, "卵": 151,
    "牛乳": 67, "りんご": 54, "バナナ": 86, "おにぎり": 180, "弁当": 700, "スープ": 80,
    "野菜炒め": 150, "チキンカツ": 400
};
const exerciseCalories = {
    "ウォーキング": 3.5, "ジョギング": 7.0, "サイクリング": 6.0, "水泳": 8.0, "筋トレ": 5.0,
    "ヨガ": 2.5, "テニス": 6.5, "バスケットボール": 8.5, "サッカー": 7.5, "階段昇降": 4.5
};

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
    
    // === NEW: Toast Notification Function ===
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);

        toast.addEventListener('animationend', () => {
            if (toast.style.animationName === 'fadeOutToast') {
                 container.removeChild(toast);
            }
        });
    }

    // === MODIFIED: init() ===
    init() {
        this.loadData();
        this.setupEventListeners(); // Changed from setupNavigation and setupForms
        this.populateSelects();
        this.updateDashboard();
        this.initCharts();
    }

    // === NEW: Centralized Event Listener Setup ===
    setupEventListeners() {
        // Navigation
        document.querySelector('.sidebar__nav').addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav__item');
            if (navItem && navItem.dataset.page) {
                this.navigateTo(navItem.dataset.page);
            }
        });
        
        // Forms
        document.getElementById('weight-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveWeight(); });
        document.getElementById('food-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveFood(); });
        document.getElementById('exercise-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveExercise(); });

        // Dynamic content listeners using event delegation
        document.body.addEventListener('click', (e) => {
            if (e.target.matches('.btn-delete-weight')) {
                const date = e.target.dataset.date;
                this.deleteWeight(date);
            }
            if (e.target.matches('.btn-delete-food')) {
                const timestamp = e.target.dataset.timestamp;
                this.deleteFood(timestamp);
            }
            if (e.target.matches('.btn-delete-exercise')) {
                const timestamp = e.target.dataset.timestamp;
                this.deleteExercise(timestamp);
            }
        });

        // Other input listeners
        document.getElementById('food-image')?.addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('food-select')?.addEventListener('change', (e) => this.updateFoodCalories(e.target.value));
        document.getElementById('exercise-select')?.addEventListener('change', () => this.calculateExerciseCalories());
        document.getElementById('duration-input')?.addEventListener('input', () => this.calculateExerciseCalories());
    }

    //navigateTo, populateSelects, saveToStorage, loadFromStorage, etc. remain largely the same
    //...

    // === MODIFIED: Methods using showToast instead of alert() ===

    saveWeight() {
        try {
            const weightInput = document.getElementById('weight-input');
            const heightInput = document.getElementById('height-input');
            
            if (!weightInput || !weightInput.value) {
                this.showToast('体重を入力してください', 'error');
                return;
            }

            const weight = parseFloat(weightInput.value);
            const height = heightInput.value ? parseFloat(heightInput.value) : (this.getLastHeight() || null);
            const date = new Date().toISOString().split('T')[0];

            if (isNaN(weight) || weight <= 0) {
                this.showToast('正しい体重を入力してください', 'error');
                return;
            }

            const weights = this.loadFromStorage('weights');
            const existingIndex = weights.findIndex(w => w.date === date);

            if (existingIndex >= 0) {
                weights[existingIndex] = { date, weight, height };
            } else {
                weights.push({ date, weight, height });
            }
            
            this.saveToStorage('weights', weights);
            document.getElementById('weight-form').reset();
            
            this.displayWeightRecords();
            this.updateDashboard();
            this.updateWeightChart();
            
            this.showToast('体重を記録しました！');
        } catch (error) {
            console.error('Error saving weight:', error);
            this.showToast('体重の保存に失敗しました', 'error');
        }
    }

    // Helper to get last known height
    getLastHeight() {
        const weights = this.loadFromStorage('weights');
        const recordWithHeight = [...weights].reverse().find(w => w.height);
        return recordWithHeight ? recordWithHeight.height : null;
    }

    // Modified displayWeightRecords to use data-attributes for deletion
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
                            ${record.height ? `| 身長: ${record.height}cm | BMI: ${bmi}` : ''}
                        </div>
                    </div>
                    <div class="record-actions">
                        <button class="btn-delete btn-delete-weight" data-date="${record.date}">削除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Modified deleteWeight to be simpler
    deleteWeight(date) {
        if (confirm(`日付: ${date} の記録を削除しますか？`)) {
            const weights = this.loadFromStorage('weights');
            const filtered = weights.filter(w => w.date !== date);
            this.saveToStorage('weights', filtered);
            this.displayWeightRecords();
            this.updateDashboard();
            this.updateWeightChart();
            this.showToast('体重記録を削除しました');
        }
    }

    // saveFood, saveExercise modified to use showToast...
    // displayFoodRecords, displayExerciseRecords modified to use data-attributes for deletion
    // deleteFood, deleteExercise modified to accept a unique identifier (timestamp)

    saveFood() {
        try {
            const foodSelect = document.getElementById('food-select');
            const caloriesInput = document.getElementById('calories-input');

            if (!foodSelect || !foodSelect.value) {
                this.showToast('食事内容を選択してください', 'error');
                return;
            }
            if (!caloriesInput || !caloriesInput.value || parseInt(caloriesInput.value) <= 0) {
                this.showToast('正しいカロリーを入力してください', 'error');
                return;
            }
            
            const newMeal = {
                date: new Date().toISOString().split('T')[0],
                type: document.getElementById('meal-type').value,
                food: foodSelect.value,
                calories: parseInt(caloriesInput.value),
                timestamp: Date.now() // Unique ID
            };

            const meals = this.loadFromStorage('meals');
            meals.push(newMeal);
            this.saveToStorage('meals', meals);

            document.getElementById('food-form').reset();
            document.getElementById('image-preview').innerHTML = '';
            
            this.displayFoodRecords();
            this.updateDashboard();
            this.showToast('食事を記録しました！');
        } catch (error) {
            console.error('Error saving food:', error);
            this.showToast('食事の保存に失敗しました', 'error');
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
        if (totalCaloriesSpan) totalCaloriesSpan.textContent = totalCalories;

        const sortedMeals = [...todayMeals].sort((a, b) => b.timestamp - a.timestamp);
        container.innerHTML = sortedMeals.map(meal => `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-title">${meal.type} - ${meal.food}</div>
                    <div class="record-details">${meal.calories} kcal</div>
                </div>
                <div class="record-actions">
                    <button class="btn-delete btn-delete-food" data-timestamp="${meal.timestamp}">削除</button>
                </div>
            </div>
        `).join('');
    }
    
    deleteFood(timestamp) {
        if (confirm('この食事記録を削除しますか？')) {
            const meals = this.loadFromStorage('meals');
            const filtered = meals.filter(m => m.timestamp != timestamp);
            this.saveToStorage('meals', filtered);
            this.displayFoodRecords();
            this.updateDashboard();
            this.showToast('食事記録を削除しました');
        }
    }
    
    // (Other methods like calculateExerciseCalories, updateDashboard, charts methods remain similar)
    // ...
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    // appインスタンスをグローバルスコープに公開しないように変更
    new HealthApp();
});
