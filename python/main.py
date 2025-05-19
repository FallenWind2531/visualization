from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

file_path = 'D:\\MyFiles\\2025AA\\DV\\Final\\archive\\material\\Global_Space_Exploration_Dataset.csv'
try:
    df = pd.read_csv(file_path)
    print("--- Loaded data successfully ---")
except FileNotFoundError:
    print(f"Error: file '{file_path}' not found.")
    exit()
except Exception as e:
    print(f"Error: {e}")
    exit()

# GET /api/v1/bubble - 气泡图
@app.route('/api/v1/bubble', methods=['GET'])
def bubble(year = 2000, country = None):
    if year not in range(2000, 2025):
        return jsonify({
            "code": 400,
            "message": "Invalid year",
            "data":  {}
        })
    year_country_means_df = df.groupby(['Year', 'Country'])[['Budget (in Billion $)', 'Duration (in Days)']].mean().reset_index()
    if country == None:
        result_df = year_country_means_df[year_country_means_df['Year'] == year][['Country', 'Budget (in Billion $)', 'Duration (in Days)']]
        return jsonify({
            "code": 200,
            "message": "Success",
            "data": result_df.values.tolist()
        })
    result_df = year_country_means_df[year_country_means_df['Year'] == year][year_country_means_df['Country'] == country][['Country', 'Budget (in Billion $)', 'Duration (in Days)']]
    return jsonify({
        "code": 200,
        "message": "Success",
        "data": result_df.values.tolist()
    })

# GET /api/v1/pie - 饼图
@app.route('/api/v1/pie', methods=['GET'])
def pie(country):
    result_df_1 = df[df['Country'] == country].groupby(['Mission Type']).size().reset_index(name = 'count')
    result_df_2 = df[df['Country'] == country].groupby(['Satellite Type']).size().reset_index(name = 'count')
    result_df_3 = df[df['Country'] == country].groupby(['Technology Used']).size().reset_index(name = 'count')
    return jsonify({
        "code": 200,
        "message": "Success",
        "data": [result_df_1.values.tolist(), result_df_2.values.tolist(), result_df_3.values.tolist()]
    })

# GET /api/v1/radar - 雷达图
@app.route('/api/v1/radar', methods=['GET'])
def radar(country):
    ei_value_mapping = {
        'Low': 1,
        'Medium': 3,
        'High': 5
    }
    df['Environmental Impact-mapped'] = df['Environmental Impact'].map(ei_value_mapping)
    result_df = df[df['Country'] == country].groupby('Country').agg(
        Count=('Country', 'count'),
        Budget=('Budget (in Billion $)', 'mean'),
        Success_Rate=('Success Rate (%)', 'mean'),
        Environmental_Impact=('Environmental Impact-mapped', 'mean'),
        Duration=('Duration (in Days)', 'mean')
    ).reset_index()
    return jsonify({
        "code": 200,
        "message": "Success",
        "data": result_df.values.tolist()
    })

# GET /api/v1/chord - 和弦图
@app.route('/api/v1/chord', methods=['GET'])
def chord(country = None):
    df_processed = df.copy()
    df_processed['Collaborating Countries_list'] = df_processed['Collaborating Countries'].str.split(',')
    new_df = df_processed.explode('Collaborating Countries_list')[['Country', 'Collaborating Countries_list']].copy() # 只选取我们需要的列
    new_df.rename(columns={'Collaborating Countries_list': 'Collaborating Countries'}, inplace=True)
    new_df['Collaborating Countries'] = new_df['Collaborating Countries'].str.strip() # 去除首尾空格
    if country != None:
        new_df = new_df[new_df['Country'] == country]
        new_df = new_df[new_df['Collaborating Countries'] != country]
    result_df = new_df[new_df['Collaborating Countries'] != '']
    result_df.reset_index(drop=True, inplace=True)
    return jsonify({
        "code": 200,
        "message": "Success",
        "data": result_df.values.tolist()
    })

# GET /api/v1/stacked_area  - 时间序列堆叠面积图
@app.route('/api/v1/stacked_area', methods=['GET'])
def stacked_area(type = 'Satellite Type'):
    if type == 'Satellite Type':
        result_df = df.groupby(['Satellite Type', 'Year']).size().reset_index(name = 'count')
        return jsonify({
            "code": 200,
            "message": "Success",
            "data": result_df.values.tolist()
        })
    elif type == 'Technology Used':
        result_df = df.groupby(['Technology Used', 'Year']).size().reset_index(name = 'count')
        return jsonify({
            "code": 200,
            "message": "Success",
            "data": result_df.values.tolist()
        })
    else:
        return jsonify({
            "code": 400,
            "message": "Invalid index",
            "data": {}
        })

# POST /api/v1/users - 创建新用户
# @app.route('/api/v1/users', methods=['POST'])
# def create_user():
#     global next_user_id
#     if not request.json or not 'name' in request.json or not 'email' in request.json:
#         return jsonify({"status": "error", "message": "Missing name or email"}), 400
    
#     new_user = {
#         "id": next_user_id,
#         "name": request.json['name'],
#         "email": request.json['email']
#     }
#     users_db[next_user_id] = new_user
#     next_user_id += 1
#     return jsonify({"status": "success", "data": new_user, "message": "User created"}), 201

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)