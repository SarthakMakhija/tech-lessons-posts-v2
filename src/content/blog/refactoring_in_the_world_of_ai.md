---
author: "Sarthak Makhija"
title: "Refactoring in the world of AI"
pubDate: 2026-01-29
tags: ["Refactoring", "AI"]
heroImage: "/refactoring-in-the-world-of-ai.png"
caption: "Image by ChatGPT"
---

### Introduction

In the era of Generative AI, we often obsess over velocity, how fast can Copilot write this function? How quickly can ChatGPT build this app? But speed is just the baseline; the true “magic” of AI lies in its ability to elevate software quality to levels that were previously painstaking to achieve. AI isn't a replacement for engineering craftsmanship; it is an amplifier. To use this effectively, you still need to be the driver, the navigator, and above all, the architect who recognizes code smells. You need to identify *Primitive Obsession* before you can ask an agent to fix it; you need to spot a *Long Method* before you can guide an LLM to extract it.

In this article, we’ll revisit a classic refactoring example, not to merely clean it up, but to demonstrate how deep knowledge of refactoring principles combined with AI agents can deliver next-level software quality. We will start where every safe refactoring journey begins: with [characterization tests](/en/blog/lets_define_legacy_code/#which-tests-to-write).

### The Classic Customer Rental Example

Let's look at a familiar piece of code (adapted from Martin Fowler's Refactoring book). It calculates rental charges for a video store.

The code below belongs to a hypothetical "Movie Rental" application that allows customers to rent either Regular or Children’s movies for a specified number of days. The application also generates a statement, which the business calls a "Text Statement." This system has been running in production for a long time without issues and has grown quite popular. Now, the business wants to generate an "HTML statement" to improve the customer experience, but crucially, they want to do this without altering the underlying logic for amount computation.

```java
import java.util.ArrayList;
import java.util.List;

public class Customer {
    private String name;
    private List<Rental> rentals = new ArrayList<>();

    public Customer(String name) {
        this.name = name;
    }
    public void addRental(Rental arg) {
        rentals.add(arg);
    }
    public String getName() {
        return name;
    }
    public String statement() {
        double totalAmount = 0;
        String result = "Rental Record for " + getName() + "\n";
        for (Rental each : rentals) {
            double thisAmount = 0;

            //determine the amounts for each line
            switch (each.getMovie().getPriceCode()) {
                case Movie.REGULAR:
                    thisAmount += 2;
                    if (each.getDaysRented() < 2)
                        thisAmount += (each.getDaysRented() - 2) * 1.5;
                    break;
                case Movie.CHILDRENS:
                    thisAmount += 1.5;
                    if (each.getDaysRented() < 3)
                        thisAmount += (each.getDaysRented() - 3) * 1.5;
                    break;
            }
            //show figures for this Rental
            result += "\t" + each.getMovie().getTitle() + "\t" +
                    String.valueOf(thisAmount) + "\n";
            totalAmount += thisAmount;
        }
        //add footer lines result
        result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
        return result;
    }
}

class Movie {
    public static final int CHILDRENS = 2;
    public static final int REGULAR = 0;

    private String title;
    private int priceCode;

    public Movie(String title, int priceCode) {
        this.title = title;
        this.priceCode = priceCode;
    }

    public String getTitle() {
        return title;
    }

    public int getPriceCode() {
        return priceCode;
    }
}

class Rental {
    private int daysRented;
    private Movie movie;

    public Rental(Movie movie, int daysRented){
        this.movie = movie;
        this.daysRented = daysRented;
    }

    public int getDaysRented() {
        return daysRented;
    }

    public Movie getMovie() {
        return movie;
    }
}
```

### Characterization Test

Before we even touch a single line of production code, we must ensure we have a safety net. This safety net comes in the form of **Characterization Tests**.

> A Characterization Test is a test that characterizes the actual behavior of a piece of code. It doesn't check for "correct" behavior but rather records what the code *currently does*.

Why do we need this? Because refactoring, by definition, means changing the structure of code without changing its behavior. If we don't know exactly what the code does right now (bugs and all), we can't guarantee we haven't broken it.

For our `Customer` class, we want to capture the exact output of the `statement()` method for various scenarios. We can ask our AI agent to generate these tests for us.

**Prompt to AI:**
Write Characterization Tests for the `statement()` method covering all branches.

**Generated Test:**
```java
@Test
public void characterizationTest() {
    Customer customer = new Customer("John Doe");

    // Regular Movie Branches
    // Line 27: if (days < 2)
    customer.addRental(new Rental(new Movie("Regular 1 Day", Movie.REGULAR), 1)); // Branch: Regular < 2
    customer.addRental(new Rental(new Movie("Regular 2 Days", Movie.REGULAR), 2)); // Branch: Regular == 2
                                                                                    // (Boundary)
    customer.addRental(new Rental(new Movie("Regular 3 Days", Movie.REGULAR), 3)); // Branch: Regular > 2

    // Children's Movie Branches
    // Line 32: if (days < 3)
    customer.addRental(new Rental(new Movie("Children 1 Day", Movie.CHILDRENS), 1)); // Branch: Childrens < 3
    customer.addRental(new Rental(new Movie("Children 3 Days", Movie.CHILDRENS), 3)); // Branch: Childrens == 3
                                                                                        // (Boundary)
    customer.addRental(new Rental(new Movie("Children 4 Days", Movie.CHILDRENS), 4)); // Branch: Childrens > 3

    // Unknown Movie Type Branch (Default case, implicitly does nothing)
    customer.addRental(new Rental(new Movie("Unknown Type", 1), 1));

    // Execute statement
    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tRegular 1 Day\t0.5\n" +
            "\tRegular 2 Days\t2.0\n" +
            "\tRegular 3 Days\t2.0\n" +
            "\tChildren 1 Day\t-1.5\n" +
            "\tChildren 3 Days\t1.5\n" +
            "\tChildren 4 Days\t1.5\n" +
            "\tUnknown Type\t0.0\n" +
            "Amount owed is 6.0\n";

    assertEquals(expected, result);
}
```

That did not go well. The AI generated a single test with all branches, however, we want to test each branch separately. Let's ask the AI to generate tests for each branch separately.

**Prompt to AI:**
I need separate unit tests for statement method. A test with MovieType = Regular, daysRented < 2, another test with MovieType = Regular, daysRented >= 2. Similarly, write tests for Childrens Movie.

**Generated Tests:**

```java
@Test
public void statementForRegularMovieRentedForLessThanTwoDays() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Regular 1 Day", Movie.REGULAR), 1));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tRegular 1 Day\t0.5\n" +
            "Amount owed is 0.5\n";

    assertEquals(expected, result);
}

@Test
public void statementForRegularMovieRentedForTwoOrMoreDays() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Regular 3 Days", Movie.REGULAR), 3));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tRegular 3 Days\t2.0\n" +
            "Amount owed is 2.0\n";

    assertEquals(expected, result);
}

@Test
public void statementForChildrensMovieRentedForLessThanThreeDays() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Children 1 Day", Movie.CHILDRENS), 1));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tChildren 1 Day\t-1.5\n" +
            "Amount owed is -1.5\n";

    assertEquals(expected, result);
}

@Test
public void statementForChildrensMovieRentedForThreeOrMoreDays() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Children 4 Days", Movie.CHILDRENS), 4));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tChildren 4 Days\t1.5\n" +
            "Amount owed is 1.5\n";

    assertEquals(expected, result);
}
```

This is much better. However, I want to add one more characterization test covering multiple rentals for a customer. This gives me confidence that the system correctly handles multiple entries, allowing me to refactor without worry. It is a judgment call to ensure I have a wide enough safety net.

**Prompt to AI:**
Add another characterization test with rentals for childres and regular movie types ..

**Generated Test:**

```java
@Test
public void statementForRegularAndChildrensMovies() {
    Customer customer = new Customer("John Doe");
    customer.addRental(new Rental(new Movie("Regular 1 Day", Movie.REGULAR), 1));
    customer.addRental(new Rental(new Movie("Children 4 Days", Movie.CHILDRENS), 4));

    String result = customer.statement();

    String expected = "Rental Record for John Doe\n" +
            "\tRegular 1 Day\t0.5\n" +
            "\tChildren 4 Days\t1.5\n" +
            "Amount owed is 2.0\n";

    assertEquals(expected, result);
}
```

Given all the tests are passing, we will make a _git commit_, push the changes and move on to refactoring the code.

### Refactoring

We are now in a position to start refactoring.

**Prompt to AI:**
Let's refactor the `statement()` method. It is a long method, and I would like to extract the rental calculation for each ` movieType` in a separate method. The method will be called `amount` and it will just accept `Rental` (/`each`). This method will return a `double` which will be assigned to `thisAmount`.

**Generated Code:**

```java
public String statement() {
    double totalAmount = 0;
    String result = "Rental Record for " + getName() + "\n";
    for (Rental each : rentals) {
        double thisAmount = amount(each);

        // show figures for this Rental
        result += "\t" + each.getMovie().getTitle() + "\t" +
                String.valueOf(thisAmount) + "\n";
        totalAmount += thisAmount;
    }
    // add footer lines result
    result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
    return result;
}

private double amount(Rental each) {
    double thisAmount = 0;
    switch (each.getMovie().getPriceCode()) {
        case Movie.REGULAR:
            thisAmount += 2;
            if (each.getDaysRented() < 2)
                thisAmount += (each.getDaysRented() - 2) * 1.5;
            break;
        case Movie.CHILDRENS:
            thisAmount += 1.5;
            if (each.getDaysRented() < 3)
                thisAmount += (each.getDaysRented() - 3) * 1.5;
            break;
    }
    return thisAmount;
}
```

Excellent! We can run all the tests and create a _git commit_. Now is the perfect time for some quick refactorings, such as renaming `each` to `rental` and `thisAmount` to `amount`. Here is the code resulting from these quick wins:

```java
public String statement() {
    double totalAmount = 0;
    String result = "Rental Record for " + getName() + "\n";
    for (Rental rental : rentals) {
        double rentalAmount = amount(rental);

        // show figures for this Rental
        result += "\t" + rental.getMovie().getTitle() + "\t" +
                String.valueOf(rentalAmount) + "\n";
        totalAmount += rentalAmount;
    }
    // add footer lines result
    result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
    return result;
}

private double amount(Rental rental) {
    double amount = 0;
    switch (rental.getMovie().getPriceCode()) {
        case Movie.REGULAR:
            amount += 2;
            if (rental.getDaysRented() < 2)
                amount += (rental.getDaysRented() - 2) * 1.5;
            break;
        case Movie.CHILDRENS:
            amount += 1.5;
            if (rental.getDaysRented() < 3)
                amount += (rental.getDaysRented() - 3) * 1.5;
            break;
    }
    return amount;
}
```

We can run all the tests and create a _git commit_.

### Move method

A close examination of the `amount()` method reveals that it relies solely on the `Rental` object. This suggests the method is a better fit for the `Rental` class. Before we move it, we can add the `static` keyword to confirm that the method does not use any properties of the `Customer` class.

Run all the tests after adding `static` keyword, they pass. Now we can move the method to the `Rental` class (remove the `static` qualifier before moving).

**Prompt to AI:**
Move the `amount()` method to the `Rental` class. 

**Generated Code:**

```java
public class Customer {
    public String statement() {
        double totalAmount = 0;
        String result = "Rental Record for " + getName() + "\n";
        for (Rental rental : rentals) {
            double rentalAmount = rental.getAmount();

            // show figures for this Rental
            result += "\t" + rental.getMovie().getTitle() + "\t" +
                    String.valueOf(rentalAmount) + "\n";
            totalAmount += rentalAmount;
        }
        // add footer lines result
        result += "Amount owed is " + String.valueOf(totalAmount) + "\n";
        return result;
    }
}

class Rental {
    public double getAmount() {
        double amount = 0;
        switch (getMovie().getPriceCode()) {
            case Movie.REGULAR:
                amount += 2;
                if (getDaysRented() < 2)
                    amount += (getDaysRented() - 2) * 1.5;
                break;
            case Movie.CHILDRENS:
                amount += 1.5;
                if (getDaysRented() < 3)
                    amount += (getDaysRented() - 3) * 1.5;
                break;
        }
    }
}
```
        
Good job! I'll start by renaming `getAmount` to `amount`. Since all our tests are passing, I'll perform one more refactoring step before committing. The `amount` method currently depends on both the `priceCode` from the `Movie` class and `daysRented` from the `Rental` class. Since the amount calculation logic is primarily driven by the `priceCode`, it makes sense to move this method to the `Movie` class and pass `daysRented` as an argument. This move also encapsulates the `priceCode` switch case within the `Movie` class, preventing it from leaking into other classes and making it easier to add new price codes in the future.

**Prompt to AI:**
Move the `amount()` method to the `Movie` class passing `daysRented` as argument. 

**Generated Code:**

```java
class Rental {
    public double amount() {
        return movie.amount(daysRented);
    }
}

class Movie {
    public double amount(int daysRented) {
        double amount = 0;
        switch (priceCode) {
            case REGULAR:
                amount += 2;
                if (daysRented < 2)
                    amount += (daysRented - 2) * 1.5;
                break;
            case CHILDRENS:
                amount += 1.5;
                if (daysRented < 3)
                    amount += (daysRented - 3) * 1.5;
                break;
        }
        return amount;
    }
}
```

Nice, and all our tests are running. This refactoring also gives us an opportunity to add unit tests for `Movie` and `Rental`.