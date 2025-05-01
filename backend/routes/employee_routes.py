from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from database import supabase, SUPABASE_BUCKET, SUPABASE_URL
from auth import get_current_user

router = APIRouter()


# Employee models for JSON body requests
class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    salary: float


class EmployeeUpdate(BaseModel):
    first_name: str
    last_name: str
    email: str
    salary: float


@router.get("/")
async def read_work_itesm(current_user: dict = Depends(get_current_user)):
    response = supabase.table("work_items").select("*").execute()
    work_items = response.data
    return {"work_items": work_items}


@router.post("/add")
async def add_employee(
    employee: EmployeeCreate,
    image: UploadFile = File(None),
    current_user: dict = Depends(get_current_user),
):
    image_url = None
    if image and image.filename != "":
        image_filename = f"{employee.first_name}_{employee.last_name}_{image.filename}"
        file_content = await image.read()
        res = supabase.storage.from_(SUPABASE_BUCKET).upload(
            image_filename, file_content
        )
        if res.status_code == 200:
            image_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{image_filename}"

    supabase.table("employees").insert(
        {
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "salary": employee.salary,
            "image_url": image_url,
        }
    ).execute()

    return {"message": "Employee added successfully"}


@router.put("/edit/{employee_id}")
async def edit_employee(
    employee_id: int,
    employee: EmployeeUpdate,
    image: UploadFile = File(None),
    current_user: dict = Depends(get_current_user),
):
    image_url = None
    if image and image.filename != "":
        image_filename = f"{employee.first_name}_{employee.last_name}_{image.filename}"
        file_content = await image.read()
        res = supabase.storage.from_(SUPABASE_BUCKET).upload(
            image_filename, file_content
        )
        if res.status_code == 200:
            image_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{image_filename}"

    update_data = employee.dict()
    if image_url:
        update_data["image_url"] = image_url

    supabase.table("employees").update(update_data).eq("id", employee_id).execute()

    return {"message": "Employee updated successfully"}


@router.delete("/deactivate/{employee_id}")
async def deactivate_employee(
    employee_id: int, current_user: dict = Depends(get_current_user)
):
    supabase.table("employees").update({"is_active": False}).eq(
        "id", employee_id
    ).execute()
    return {"message": "Employee deactivated successfully"}
