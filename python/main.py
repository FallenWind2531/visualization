from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

space_file_path = './visualization/python/material/Global_Space_Exploration_Dataset.csv'
try:
    space_df = pd.read_csv(space_file_path)
    print("--- Loaded data successfully ---")
except FileNotFoundError:
    print(f"Error: file '{space_file_path}' not found.")
    exit()
except Exception as e:
    print(f"Error: {e}")
    exit()

GDP_file_path = './visualization/python/material/Global_GDP_Dataset.csv'
try:
    GDP_df = pd.read_csv(GDP_file_path)
    print("--- Loaded data successfully ---")
except FileNotFoundError:
    print(f"Error: file '{GDP_file_path}' not found.")
    exit()
except Exception as e:
    print(f"Error: {e}")
    exit()

# GET /api/v1/bubble - 气泡图
@app.route('/api/v1/bubble', methods=['GET'])
def bubble():
    year = 2000
    if request.args.get('year') != None:
        year = int(request.args.get('year'))
    country = request.args.get('country')
    if year not in range(2000, 2025):
        response = jsonify({
            "code": 400,
            "message": "Invalid year",
            "data": []
        })
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    GDP_long = GDP_df.melt(id_vars=['Country'], var_name='Year', value_name='GDP')
    GDP_long['Year'] = GDP_long['Year'].astype(int)
    df = pd.merge(space_df, GDP_long, on=['Country', 'Year'], how='left')
    year_country_means_df = df.groupby(['Year', 'Country']).agg(
        GDP=('GDP', 'mean'),
        Budget=('Budget (in Billion $)', 'sum'),
        Duration=('Duration (in Days)', 'sum')
    ).reset_index()
    if country == None:
        result_df = year_country_means_df[year_country_means_df['Year'] == year][['Country', 'GDP', 'Budget', 'Duration']]
        result_list = result_df.values.tolist()
        response = jsonify({
            "code": 200,
            "message": "Success",
            "data": result_list
        })
    else:
        result_df = year_country_means_df[year_country_means_df['Year'] == year][year_country_means_df['Country'] == country][['Country', 'GDP', 'Budget (in Billion $)', 'Duration (in Days)']]
        result_list = result_df.values.tolist()
        response = jsonify({
            "code": 200,
            "message": "Success",
            "data": result_list
        })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

# GET /api/v1/pie - 饼图
@app.route('/api/v1/pie', methods=['GET'])
def pie():
    country = request.args.get('country')
    result_df_1 = space_df[space_df['Country'] == country].groupby(['Mission Type']).size().reset_index(name = 'count')
    result_df_2 = space_df[space_df['Country'] == country].groupby(['Satellite Type']).size().reset_index(name = 'count')
    result_df_3 = space_df[space_df['Country'] == country].groupby(['Technology Used']).size().reset_index(name = 'count')
    result_list = [result_df_1.values.tolist(), result_df_2.values.tolist(), result_df_3.values.tolist()]
    response = jsonify({
        "code": 200,
        "message": "Success",
        "data": result_list
    })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

# GET /api/v1/radar - 雷达图
@app.route('/api/v1/radar', methods=['GET'])
def radar():
    country = request.args.get('country')
    ei_value_mapping = {
        'Low': 1,
        'Medium': 3,
        'High': 5
    }
    space_df['Environmental Impact-mapped'] = space_df['Environmental Impact'].map(ei_value_mapping)
    result_df = space_df[space_df['Country'] == country].groupby('Country').agg(
        Count=('Country', 'count'),
        Budget=('Budget (in Billion $)', 'mean'),
        Success_Rate=('Success Rate (%)', 'mean'),
        Environmental_Impact=('Environmental Impact-mapped', 'mean'),
        Duration=('Duration (in Days)', 'mean')
    ).reset_index()
    result_list = result_df.values.tolist()
    response = jsonify({
        "code": 200,
        "message": "Success",
        "data": result_list
    })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

# GET /api/v1/chord - 和弦图
@app.route('/api/v1/chord', methods=['GET'])
def chord():
    country = request.args.get('country')
    df_processed = space_df.copy()
    df_processed = df_processed[~df_processed['Collaborating Countries'].isna() & (df_processed['Collaborating Countries'] != '')]
    df_processed['Collaborating Countries_list'] = df_processed['Collaborating Countries'].str.split(',')
    new_df = df_processed.explode('Collaborating Countries_list')[['Country', 'Collaborating Countries_list']].copy() # 只选取我们需要的列
    new_df.rename(columns={'Collaborating Countries_list': 'Collaborating Countries'}, inplace=True)
    new_df['Collaborating Countries'] = new_df['Collaborating Countries'].str.strip() # 去除首尾空格
    if country != None:
        new_df = new_df[new_df['Country'] == country]
        new_df = new_df[new_df['Collaborating Countries'] != country]
    result_df = new_df[new_df['Collaborating Countries'] != '']
    result_df.reset_index(drop=True, inplace=True)
    result_list = result_df.values.tolist()
    response = jsonify({
        "code": 200,
        "message": "Success",
        "data": result_list
    })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

# GET /api/v1/stacked_area  - 时间序列堆叠面积图
@app.route('/api/v1/stacked_area', methods=['GET'])
def stacked_area():
    type = request.args.get('type')
    if type == 'Satellite Type':
        result_df = space_df.groupby(['Satellite Type', 'Year']).size().reset_index(name = 'count')
        result_list = result_df.values.tolist()
        response = jsonify({
            "code": 200,
            "message": "Success",
            "data": result_list
        })
    elif type == 'Technology Used':
        result_df = space_df.groupby(['Technology Used', 'Year']).size().reset_index(name = 'count')
        result_list = result_df.values.tolist()
        response = jsonify({
            "code": 200,
            "message": "Success",
            "data": result_list
        })
    else:
        response =  jsonify({
            "code": 400,
            "message": "Invalid index",
            "data": {}
        })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

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